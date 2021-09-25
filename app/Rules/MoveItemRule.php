<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

use Illuminate\Support\Facades\DB;

class MoveItemRule implements Rule
{
    private $item_id;
    private $target_id;
    private $origin_id;
    private $error_msg;
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($item_id, $target_id, $origin_id = null)
    {
        $this->item_id = $item_id;
        $this->target_id = $target_id;
        $this->origin_id = $origin_id;
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
        $value = json_decode($value, true);
        $qt_target = json_decode($value['target'], true);
        $qt_origin = json_decode($value['origin'], true);

        $qt_storage = json_decode(
            DB::select(
                'SELECT size_and_quantity FROM items_storage WHERE id=?', [$this->item_id]
            )[0]->size_and_quantity, true
        );

        $items = DB::select(
            'SELECT JSON_EXTRACT(items, "$.?") AS qt FROM stores 
            WHERE id NOT IN(?,?) AND JSON_EXTRACT(items, "$.?")',
            [
                $this->item_id, $this->target_id, ($this->origin_id ? $this->origin_id : 0),
                $this->item_id
            ]
        );

        $qt_stores = array_map(function($item){
            return json_decode($item->qt, true);
        }, $items);

        foreach($qt_target as $size => $qt){
            $total = $qt;
            foreach($qt_stores as $qt_store){
                $total += $qt_store[$size];
            }
            if($origin_id){
                $total += $qt_origin[$size];
            }
            if($total > $qt_storage[$size]){
                $this->error_msg = 'Jumlah item ukuran '.strtoupper($size).' melebihi batas';
                return false;
            }
        }
        return true;
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
