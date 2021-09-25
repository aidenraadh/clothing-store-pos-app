<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Stores;
use App\Models\ItemsTransferLog;

use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

use App\Rules\StoreItemsRule;
use App\Rules\HTMLSpecialCharsRule;
use App\Rules\MoveItemRule;

class StoresController extends Controller
{
    public function index(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'store_id' => [
                'bail','required_with_all:rows_limit','integer',             
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),                   
            ],
            'rows_limit' => [
                'bail','required_with_all:store_id','integer'                 
            ],            
        ], [
            'store_id.required_with_all' => 'Toko atau gudang harus dipilih.',
            'store_id.exists' => 'Toko atau gudang tidak ditemukan.',
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }        

        $filters_inputs = [
            // If the user is employee, the store ID must be 
            // the store ID where the employee works
            'store_id' => (Auth::guard('employee')->check() ? 
                Auth::user()->store_id : 
                $request->input('store_id', 'default')
            ),
            'rows_limit' => $request->input('rows_limit', 'default'),
            'rows_offset' => $request->input('rows_offset', 'default'),
        ];
        $response = [
            'items' => $Stores->indexItems($filters_inputs),
            'filters' => session('store_items_filters'),
            'info' => (session('store_items_filters')['store_id'] === '' ? 
                    null : 
                    $Stores->get(session('store_items_filters')['store_id'])[0]
                ),
            'all_stores' => $Stores->index(),
        ];
        if(Auth::guard('admin')->check()){
            $response['statistics'] = $Stores->getStatistics(
                session('store_items_filters')['store_id']
            );
        }

        return response($response, 200);        
    }

    public function store(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'name' => [
                'bail','required','string','max:50',new HTMLSpecialCharsRule(),
                'unique:stores',
            ],
            'active_store' => ['bail','required','boolean'],
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $created_store_id = $Stores->store($request->all());
        
        return response($Stores->get($created_store_id), 200);
    }

    public function update(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer',
                Rule::exists('stores')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],
            'name' => [
                'bail','required','string',new HTMLSpecialCharsRule(),
                Rule::unique('stores')->ignore($request->id),
            ],
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }

        return response($Stores->update(
            $request->id, ['name' => $request->name]), 200
        );
    }

    public function delete(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer',
                Rule::exists('stores')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $Stores->delete($request->id);

        return response($request->id, 200);
    }

    public function getItem(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'store_id' => ['bail','required','integer',
                Rule::exists('stores', 'id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],
            'item_id' => ['bail','required','integer',
                Rule::exists('items_storage', 'id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],            
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }

        return response($Stores->getItem($request->store_id, $request->item_id), 200);        
    }

    public function loadItems(Stores $Stores){
        return response($Stores->loadItems(), 200);
    }
    
    public function updateItem(Request $request, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'store_id' => ['bail','required','integer',
                Rule::exists('stores', 'id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],
            'items' => ['bail','required','string', new StoreItemsRule('update')],
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $Stores->updateItem($request->store_id, $request->items);
        return response(true, 200);        
    }    

    public function transferItems(
        Request $request, Stores $Stores, ItemsTransferLog $ItemsTransferLog
    )
    {
        $data = $request->all();
        $data['employee_id'] = Auth::id();

        $validator = Validator::make($data, [
            'origin_store_id' => ['bail','required','integer',
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],                         
            'target_store_id' => ['bail','required','integer',
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],                                  
            'quantities' => [
                'bail', 'required',
                new StoreItemsRule(
                    'transfer', $data['item_id'],
                    $data['origin_store_id'], $data['target_store_id']
                )
            ],
        ],[
            'origin_store_id.required' => 'Toko asal belum dipilih',
            'target_store_id.required' => 'Toko tujuan belum dipilih',
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $Stores->transferItems(
            $data['item_id'], $data['quantities'],
            $data['origin_store_id'], $data['target_store_id']
        );
        $ItemsTransferLog->store($data);

        return response(true, 200);
    }
}
