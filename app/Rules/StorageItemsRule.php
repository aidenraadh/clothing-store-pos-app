<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class StorageItemsRule implements Rule
{
    private $error_msg;
    private $item_id;
    private $accepted_item_sizes;
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($item_id = null)
    {
        $this->item_id = $item_id;
        $this->accepted_item_sizes = config('app.accepted_item_sizes');
    }

    private function checkItemName($name, $ignore_self = false){
        if(!is_string($name)){
            $this->error_msg = 'Nama item tidak valid.';
            return false;
        }
        $sanitized_name = preg_replace('/\s{2,}/', ' ', trim($name));

        if(empty($sanitized_name)){
            $this->error_msg = 'Nama item tidak valid.';
            return false;
        }
        if(strlen($sanitized_name) > 50){
            $this->error_msg = 'Item dengan nama "'.$sanitized_name.'" melebihi batas 50 karakter.';
            return false;
        }
        preg_match_all('/<[^<]+>/', $sanitized_name, $html_tags);

        if($html_tags[0]){
            $this->error_msg = 'Nama item tidak valid.';
            return false;
        }
        
        $item_name = ($ignore_self ? 
            DB::select(
                'SELECT id FROM items_storage WHERE name=? AND id != ? LIMIT 1',
                [$sanitized_name, $this->item_id]
            ) :
            DB::select('SELECT id FROM items_storage WHERE name=? LIMIT 1', [$sanitized_name])
        );
        if(!empty($item_name)){
            $this->error_msg = 'Item dengan nama "'.ucwords($sanitized_name).'" sudah ada.';
            return false;
        }
        return true;
    }

    private function checkItemSize($size, $item_name){
        if(!in_array($size, $this->accepted_item_sizes, true)){
            $this->error_msg = 'Ukuran '.strtoupper($size).' pada item "'.
            ucwords($item_name).'" tidak valid.';
            return false;
        }
        return true;
    }

    private function checkProductionPrices($production_prices, $item_name){
        foreach($production_prices as $size => $price){
            if(!$this->checkItemSize($size, $item_name)){
                return false;
            }
            if(!filter_var($price, FILTER_VALIDATE_INT, ["options" => ["min_range"=> 1]])){
                $this->error_msg = 'Harga produksi pada item "'.$item_name.'" ukuran: '
                .strtoupper($item_size).' tidak valid.';                
                return false;
            }
        }
        return true;
    }
    
    private function checkSellingPrices($selling_prices, $item_name){
        foreach($selling_prices as $size => $price){
            if(!$this->checkItemSize($size, $item_name)){
                return false;
            }
            if(!filter_var($price, FILTER_VALIDATE_INT, ["options" => ["min_range"=> 1]])){
                $this->error_msg = 'Harga jual pada item "'.$item_name.'" ukuran: '
                .strtoupper($item_size).' tidak valid.';                
                return false;
            }
        }
        return true;
    }       

    // Validate items for storing
    private function validateItemsStoring($items){
        $items = json_decode($items, true);
        if(empty($items)){
            $this->error_msg = 'Belum ada item yang ditambahkan.';
            return false;            
        }

        foreach($items as $item){
            if(!$this->checkItemName($item['name'])){
                return false;
            }
            if(!$this->checkProductionPrices($item['production_prices'], $item['name'])){
                return false;
            }
            if(!$this->checkSellingPrices($item['selling_prices'], $item['name'])){
                return false;
            }            
        }

        return true;
    }
    // Validate items for updating
    private function validateItemsUpdating($item){
        $item = json_decode($item, true);     

        if(!$this->checkItemName($item['name'], true)){
            return false;
        }
        if(!$this->checkProductionPrices($item['production_prices'], $item['name'])){
            return false;
        }
        if(!$this->checkSellingPrices($item['selling_prices'], $item['name'])){
            return false;
        }        

        return true;
    }
    // Validate item for deletion
    private function validateItemsDeletion($item_id){       
        $item_on_stores = DB::select(
            'SELECT name,JSON_EXTRACT(items, ?) AS item_data FROM stores
            WHERE deleted_at IS NULL AND JSON_EXTRACT(items, ?) IS NOT NULL',
            ['$.'.$item_id, '$.'.$item_id]
        );

        if(!empty($item_on_stores)){
            foreach($item_on_stores as $item_on_store){
                $item_quantity = 0;
                $item_data = json_decode($item_on_store->item_data, true);
                foreach($item_data as $size => $data){
                    $item_quantity += $data['quantity'];
                }
                if($item_quantity !== 0){
                    $this->error_msg = 'Item ini masih tersimpan di: '.$item_on_store->name.
                    '. Silahkan kosongkan terlebih dahulu';            
                    return false;
                }
            }
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
    public function passes($attribute, $value)
    {
        if($attribute === 'items' && $this->item_id === null){
            return $this->validateItemsStoring($value);
        }
        else if($attribute === 'item' && $this->item_id !== null){
            return $this->validateItemsUpdating($value);
        }
        else if($attribute === 'id'){
            return $this->validateItemsDeletion($value);
        }
        else{
            abort(403);
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
