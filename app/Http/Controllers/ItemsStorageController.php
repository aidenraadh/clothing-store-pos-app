<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use App\Rules\HTMLSpecialCharsRule;
use App\Rules\StorageItemsRule;

use App\Models\ItemsStorage;
use App\Models\Stores;

class ItemsStorageController extends Controller
{
    public function index(Request $request, ItemsStorage $ItemsStorage){
        $validator = Validator::make($request->all(), [
            'rows_limit' => ['bail','integer'],            
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }        

        $filters_inputs = [
            'rows_limit' => $request->input('rows_limit', 'default'),
            'rows_offset' => $request->input('rows_offset', 'default'),
        ];        
        return response([
            'rows' => $ItemsStorage->index($filters_inputs),
            'filters' => session('storage_items_filters'),
        ], 200);
    }

    public function store(Request $request, ItemsStorage $ItemsStorage){
        $validator = Validator::make($request->all(), [
            'items' => ['bail','required','json',new StorageItemsRule()],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $ItemsStorage->store($request->items);

        return response(true, 200);
    }

    public function get(Request $request, ItemsStorage $ItemsStorage){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer',
                Rule::exists('items_storage')->where(function($query){
                    return $query->where('deleted_at', null);
                }),            
            ],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        return response($ItemsStorage->get($request->id), 200);
    }    

    public function update(Request $request, ItemsStorage $ItemsStorage){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer',
                Rule::exists('items_storage')->where(function($query){
                    return $query->where('deleted_at', null);
                }),            
            ],
            'item' => ['bail','required','json',new StorageItemsRule($request->id)],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $ItemsStorage->update($request->id, $request->item);

        return response(true, 200);
    }

    public function delete(Request $request, ItemsStorage $ItemsStorage, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer',
                Rule::exists('items_storage')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
                new StorageItemsRule()
            ],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        // Remove the item from items storage
        $ItemsStorage->delete($request->id);
        // Remove the item from the stores
        $Stores->deleteItem($request->id);
        
        return response(true, 200);
    }

    public function search(Request $request, ItemsStorage $ItemsStorage){
        $validator = Validator::make($request->all(), [          
            'item_name' => ['bail','required','string',new HTMLSpecialCharsRule()],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        return response($ItemsStorage->getByName($request->item_name), 200);       
    }

    public function load(ItemsStorage $ItemsStorage){
        return response($ItemsStorage->load(), 200);
    }
        
}
