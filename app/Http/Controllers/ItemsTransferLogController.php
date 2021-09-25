<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use App\Models\ItemsTransferLog;
use App\Models\Stores;

class ItemsTransferLogController extends Controller
{
    public function index(Request $request, ItemsTransferLog $ItemsTransferLog, Stores $Stores){
        $fields_rules = [
            'rows_limit' => ['bail','nullable','integer'],
            'rows_offset' => ['bail','nullable','integer'],            
        ];
        if($request->has('origin_store_id') && $request->origin_store_id !== 'all'){
            $fields_rules['origin_store_id'] = [
                'bail','required','integer',
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),                                   
            ];
        }
        if($request->has('target_store_id') && $request->target_store_id !== 'all'){
            $fields_rules['target_store_id'] = [
                'bail','required','integer',
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),                                  
            ];
        }
        $validator = Validator::make($request->all(), $fields_rules);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }        

        $filters_inputs = [
            'origin_store_id' => $request->input('origin_store_id', 'default'),
            'target_store_id' => $request->input('target_store_id', 'default'),
            'rows_limit' => $request->input('rows_limit', 'default'),
            'rows_offset' => $request->input('rows_offset', 'default'),
        ];
        return response([
            'rows' => $ItemsTransferLog->index($filters_inputs),
            'filters' => session('items_transfer_log_filters'),
            'all_stores' => $Stores->index()
        ], 200);
    }

    public function load(ItemsTransferLog $ItemsTransferLog){
        return response($ItemsTransferLog->load(), 200);
    }
}
