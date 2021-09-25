<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

use Illuminate\Support\Facades\DB;

class StoreItemsRule implements Rule
{
    private $verb;
    private $item_id;
    private $origin_store_id;
    private $target_store_id;
    private $accepted_item_sizes;
    private $error_msg;
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct(
        $verb, $item_id = null, $origin_store_id = null, $target_store_id = null
    ){
        $this->verb = $verb;
        $this->item_id = $item_id;
        $this->origin_store_id = $origin_store_id;
        $this->target_store_id = $target_store_id;
        $this->accepted_item_sizes = config('app.accepted_item_sizes');
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    // Get the item name as well as checking if the item exists
    private function getItemName($item_id){
        $item = DB::select(
            'SELECT name FROM items_storage WHERE id=? AND deleted_at IS NULL',
            [$item_id]
        );
        if(empty($item)){
            $this->error_msg = 'Item tidak ditemukan.';
            return false;
        }
        return ucwords($item[0]->name);
    }

    // This number must be equal or greater than zero
    private function checkNum($num){
        if($num !== 0 && !filter_var($num, FILTER_VALIDATE_INT,["options" => ["min_range"=> 1]]))
        {
            return false;
        }
        return true;
    }

    // Check if the item's size name is exists
    private function checkItemSize($size, $item_name){
        if(!in_array($size, $this->accepted_item_sizes, true)){
            $this->error_msg = 'Ukuran '.strtoupper($size).' pada item "'.
            $item_name.'" tidak valid.';
            return false;
        }
        return true;
    }

    private function validateItemUpdating($value){
        $items = json_decode($value, true);

        if(empty($items)){
            $this->error_msg = 'Item tidak boleh kosong.';
            return false;
        }
        foreach($items as $id => $sizes){
            $item_name = $this->getItemName($id);

            if($item_name === false){
                return false;
            }
            foreach($sizes as $size => $data){
                if(!$this->checkItemSize($size, $item_name)){
                    $this->error_msg = 'Jenis ukuran '.strtoupper($size).
                    ' pada "'.$item_name.'" tidak valid.';                       
                    return false;
                }
                if(!$this->checkNum($data['quantity'])){
                    $this->error_msg = 'Jumlah ukuran '.strtoupper($size).
                    ' pada "'.$item_name.'" tidak valid.';
                    return false;
                }
                if(isset($data['selling_price']) && !$this->checkNum($data['selling_price'])){
                    $this->error_msg = 'Harga jual pada item "'.$item_name.'" ukuran: '
                    .strtoupper($item_size).' tidak valid.';                
                    return false;
                }
            }            
        }
        return true;
    }
    
    private function validateItemTransfer($value){
        $quantities = json_decode($value, true);

        // Get the item name
        $item_name = $this->getItemName($this->item_id);
        if($item_name === false)
            return false;
        
        // Get the item quantities on origin store
        $item_on_origin = DB::select('
			SELECT JSON_EXTRACT(items, ?) AS item_data
            FROM stores WHERE id=?',
            ['$.'.$this->item_id, $this->origin_store_id]
		)[0]->item_data;

        $item_on_origin = (
            $item_on_origin ?
            json_decode($item_on_origin, true) :
            null
        );

        if($item_on_origin === null){
            $this->error_msg = 'Item tidak ditemukan di toko asal.';                
            return false;            
        }

        if(empty($quantities)){
            $this->error_msg = 'Jumlah item yang ditransfer kosong.';                
            return false;                
        }        

        foreach($quantities as $size => $quantity){
            if(!$this->checkItemSize($size, $item_name)){
                return false;
            }
            if(!$this->checkNum($quantity)){
                $this->error_msg = 'Jumlah ukuran '.strtoupper($size).
                ' yang dipindahkan pada "'.$item_name.'" tidak valid.';                
                return false;
            }
            if(!isset($item_on_origin[$size])){
                $this->error_msg = 'Jumlah ukuran '.strtoupper($size).
                ' yang dipindahkan pada item "'.$item_name.'" melebihi batas maksimum.';                
                return false;
            }
            // Check if the item moved from origin store is not less than zero
            if($item_on_origin[$size]['quantity'] - $quantity < 0){
                $this->error_msg = 'Jumlah ukuran '.strtoupper($size).
                ' yang dipindahkan pada item "'.$item_name.'" melebihi batas maksimum.';                
                return false;                
            }
        }
        return true;
    }
    
    public function passes($attribute, $value)
    {
        switch($this->verb){
            case 'update':
                return $this->validateItemUpdating($value);
                break;
            case 'transfer':
                return $this->validateItemTransfer($value);
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
