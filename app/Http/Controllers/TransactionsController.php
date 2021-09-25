<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Transactions;
use App\Models\Stores;
use App\Models\ItemsStorage;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

use Illuminate\Validation\Rule;
use App\Rules\TransactionsRule;
use App\Rules\HTMLSpecialCharsRule;

class TransactionsController extends Controller
{
    public function index(Request $request, Transactions $Transactions, Stores $Stores){
        $validator = Validator::make($request->all(), [
            'store_id' => [
                'bail',
                'required_with_all:rows_limit,timezone_offset,
                transactions_start_time,transactions_end_time,',
                'integer',             
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),                   
            ],
            'transactions_start_time' => [
                'bail',
                'required_with_all:store_id,rows_limit,
                transactions_end_time,timezone_offset',
                'date',
                'before:'.$request->transactions_end_time,
            ],
            'transactions_end_time' => [
                'bail',
                'required_with_all:timezone_offset,store_id,
                rows_limit,transactions_start_time',
                'date',
                'after:'.$request->transactions_start_time,                         
            ],
            'timezone_offset' => [
                'bail',
                'required_with_all:transactions_start_time,
                transactions_end_time,store_id,rows_limit',
                'integer'                
            ],
        ],[
            'store_id.integer' => 'Toko atau gudang harus dipilih.',
            'transactions_start_time.date' => 'Tanggal awal harus diisi.',
            'transactions_end_time.date' => 'Tanggal akhir harus diisi.',
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }        

        $filters_inputs = [
            'store_id' => $request->input('store_id', 'default'),
            'transactions_start_time' => $request->input('transactions_start_time', 'default'),
            'transactions_end_time' => $request->input('transactions_end_time', 'default'),
            'timezone_offset' => $request->input('timezone_offset', 'default'),
            'rows_limit' => $request->input('rows_limit', 'default'),
            'rows_offset' => $request->input('rows_offset', 'default'),
        ];
        if(Auth::guard('employee')->check())
            $filters_inputs['store_id'] = Auth::user()->store_id;
        
        $response = [
            'rows' => $Transactions->index($filters_inputs),
            'filters' => session('transactions_filters', []),
            'incomplete_transactions' => $Transactions->indexIncompleteTrasactions()
        ];
        $response['statistics'] = $Transactions->getStatistics(
            $response['filters']['store_id'],
            $response['filters']['transactions_start_time'],
            $response['filters']['transactions_end_time'],
            $response['filters']['timezone_offset']
        );        

        if(Auth::guard('admin')->check()){           
            $response['stores'] = $Stores->index(true);
        }
        
        return response($response, 200);
    }
    
    public function store(Request $request, Transactions $Transactions){
        $employee = Auth::user();
        // Get all request input;
        $data = $request->all();
        // Add the employee ID
        $data['employee_id'] = $employee->id;
        // Add the store ID
        $data['store_id'] = $employee->store_id;
        $TransactionsRule = new TransactionsRule($data['store_id']);

        $validator = Validator::make($data, [
            'costumer_name' => ['bail','required','string',new HTMLSpecialCharsRule()],
            'store_id' => [
                'bail','required','integer',
                Rule::exists('stores','id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),
            ],
            'transaction_time' => ['bail','required','date'],
            'timezone_offset' => ['bail','required','integer'],
            'items' => ['bail','required',$TransactionsRule],
            'payment_details' => ['bail','required',$TransactionsRule],
        ], [
            'transaction_time.date' => 'Mohon isi waktu transaksi.',
            'costumer_name.required' => 'Mohon isi nama pelanggan.',
        ]);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $Transactions->store($data);

        return response(true, 200);
    }

    public function update(Request $request, Transactions $Transactions){
        $data = $request->only(['id','payment_details','timezone_offset']);
        
        $validator = Validator::make($data, [
            'id' => ['bail','required','integer','exists:transactions'],
            'timezone_offset' => ['bail','required','integer'],
            'payment_details' => ['bail','required',new TransactionsRule()],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        $Transactions->update($request->id, $data);
        return response(true, 200);
    }

    public function delete(
        Request $request, Transactions $Transactions, Stores $Stores,
        ItemsStorage $ItemsStorage
    ){
        $validator = Validator::make($request->all(), [
            'id' => ['bail','required','integer','exists:transactions'],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        // Get the transaction
        $transaction = $Transactions->get($request->id)[0];
        // Get the transaction items
        $TransactionItems = json_decode($transaction->items_details, true);
        // Get the store items
        $StoreItems = json_decode($Stores->get($transaction->store_id)[0]->items, true);
        // Prepare the returned store items
        $returned_store_item = [];
        foreach($TransactionItems as $item_id => $name_details){
            $returned_store_item[$item_id] = [];
            // Save the item for returning only if it hasnt been deleted
            if(!empty($ItemsStorage->get($item_id))){
                foreach($name_details['details'] as $size => $details){
                    $returned_store_item[$item_id][$size] = ['quantity' => 
                        $details['quantity'] + $StoreItems[$item_id][$size]['quantity']
                    ];
                }
            }
        }
        // Return the item to the store if there are any
        if(!empty($returned_store_item)){
            $Stores->updateItem(
                $transaction->store_id,
                json_encode($returned_store_item, true)
            );
        }
        // Delete the transaction
        $Transactions->delete($request->id);
        return response(true, 200);
    }

    public function load(Transactions $Transactions){
        return response($Transactions->load(), 200);   
    }

    public function getStatistics(){
        return response($Transactions->getStatistics(), 200);        
    }    

}
