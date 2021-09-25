<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class TransactionsRule implements Rule
{
    private $error_msg;
    private $store_id;
    private $accepted_item_sizes;

    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($store_id = null)
    {
        $this->store_id = $store_id;
        $this->accepted_item_sizes = config('app.accepted_item_sizes');
    }
    private function getItemOnStorage($item_id){
        $item_on_storage = DB::select(
            'SELECT name,production_prices,selling_prices 
            FROM items_storage WHERE id=? AND deleted_at IS NULL',
            [$item_id]
        );
        if(empty($item_on_storage)){
            $this->error_msg = 'Salah satu item telah dihapus';
            return false;
        }
        $item_on_storage = json_decode(json_encode($item_on_storage[0], true), true);
        $item_on_storage['production_prices'] = json_decode(
            $item_on_storage['production_prices'], true
        );
        $item_on_storage['selling_prices'] = json_decode(
            $item_on_storage['selling_prices'], true
        );
        return $item_on_storage;
    }
    private function getItemOnStore($item_id,$item_name){
        $item_on_store = DB::select(
            'SELECT JSON_EXTRACT(items, ?) AS item_on_store FROM stores WHERE id=?',
            ['$.'.$item_id, $this->store_id]
        );
        if(empty($item_on_store) ){
            $this->error_msg = 'Toko tidak ditemukan.';
            return false;
        }
        $item_on_store = $item_on_store[0]->item_on_store;
        // The item is not exists inside the store
        if($item_on_store === null){
            $this->error_msg = 'Item "'.ucwords($item_name).
            '" tidak tersedia di toko.';
            return false;
        }
        return json_decode($item_on_store, true);   
    }    
    // The number passed here must be positive integer
    private function positiveInteger($num){
        if($num !== 0 && !filter_var($num, FILTER_VALIDATE_INT,["options" => ["min_range"=> 1]]))
        {
            return false;
        }
        return true;
    }
    // Check item quantity whether it is greater than the quantity in the store or not
    private function checkItemQuantity($item_name,$item_size,$quantity_on_store,$quantity_sold){
        if(!$this->positiveInteger($quantity_sold)){
            $this->error_msg = 'Jumlah item "'.ucwords($item_name).
            '" ukuran '.strtoupper($item_size).' tidak valid.';
            return false;
        }
        if($quantity_on_store < $quantity_sold){
            $this->error_msg = 'Jumlah Item "'.ucwords($item_name).
            '" ukuran '.strtoupper($item_size).' hanya tersisa '.
            $quantity_on_store.' di toko';
            return false;
        }        
        return true;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    private function validateSoldItems($items){
        $items = json_decode($items, true);   
        if(empty($items)){
            $this->error_msg = 'Tidak ada item yang ditambahkan.';
            return false;
        }
        foreach($items as $id => $sizes){
            // The item data inside the storage
            $item_on_storage = $this->getItemOnStorage($id);
            if($item_on_storage === false){
                return false;
            }
            // The item data inside the store
            $item_on_store = $this->getItemOnStore($id,$item_on_storage['name']);
            if($item_on_store === false){
                return false;
            }                

            // There're no quantity added for this item
            if(empty($sizes)){
                $this->error_msg = 'Jumlah item "'.ucwords($item_on_storage['name']).
                '" masih kosong.';
                return false;
            }
            foreach($sizes as $size => $details){
                // Check item production price
                if(!isset($item_on_storage['production_prices'][$size])){
                    $this->error_msg = 'Item "'.ucwords($item_on_storage['name']).
                    '" ukuran '.strtoupper($size).' belum memiliki harga produksi.';
                    return false;                    
                }
                // Check item selling price
                if(!isset($item_on_storage['selling_prices'][$size])){
                    $this->error_msg = 'Item "'.ucwords($item_on_storage['name']).
                    '" ukuran '.strtoupper($size).' belum memiliki harga jual.';
                    return false;                    
                }
                // Check item custom price if its not null
                if(
                    $details['custom_price'] !== null &&
                    !$this->positiveInteger($details['custom_price'])
                ){
                    $this->error_msg = 'Harga custom item "'.ucwords($item_on_storage['name']).
                    '" ukuran '.strtoupper($size).' tidak valud.';
                    return false;  
                }       

                if(
                    !$this->checkItemQuantity(
                        $item_on_storage['name'],$size,
                        $item_on_store[$size]['quantity'],$details['quantity']
                    )
                ){
                    return false;
                }
            }
        }

        return true;
    }
    private function validatePaymentDetails($payment_detail){
        $payment_detail = json_decode($payment_detail, true);
        // Validate the amount paid
        if(!$this->positiveInteger($payment_detail['amount'])){
            $this->error_msg = 'Wrong number format.';
            return false;               
        }
        return true;
    }
    public function passes($attribute, $value){
        switch($attribute){
            case 'items':
                return $this->validateSoldItems($value);
                break;
            case 'payment_details':
                return $this->validatePaymentDetails($value);
                break;
            default: return false;
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->error_msg;
    }
}
