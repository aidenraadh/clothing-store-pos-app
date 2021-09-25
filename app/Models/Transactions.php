<?php

namespace App\Models;

use App\Models\Stores;

use Illuminate\Support\Facades\DB;

class Transactions
{
    private $current_time;
    private $select_queries = [
        'queries' => 
            'SELECT
            transactions.id AS id,
            transactions.costumer_name AS costumer_name,
            transactions.store_id AS store_id,
            transactions.items_details AS items_details,
            transactions.cost_details AS cost_details,
            transactions.payment_details AS payment_details,
            transactions.transaction_time AS transaction_time,
            transactions.employee_id AS employee_id,
            stores.name AS store_name,
            employees.name AS employee_name
            FROM transactions
            INNER JOIN employees ON transactions.employee_id=employees.id
            INNER JOIN stores ON transactions.store_id=stores.id
            WHERE transactions.deleted_at IS NULL',
        'par' => []
    ];

    public function __construct(){
        $this->current_time = date("Y-m-d H:i:s", time()); 
    }
    // Set the transactions table's filter queries
    // Structure:
    // $transactions_filters = [
    //     'store_id' => 3, // int, the store where the transactions occur
    //     'transaction_times' => [
    //         '2020-01-01', '2020-06-01'
    //     ], // str, the time where the transactions occur
    //     'timezone_offset' => 140, // int, the user's browser timezone offset
    // ];

    private function setDefaultFilters($filter_key){
        switch($filter_key){
            case 'store_id': 
                $Stores = new Stores();
                $default_store_id = $Stores->index(true);
                
                return (empty($default_store_id) ? 
                    '' : $default_store_id[0]->id
                );
                break;
            case 'transactions_start_time':
                return date('Y-m-d', strtotime('-1 week')).' 00:00:00';
                break;
            case 'transactions_end_time': 
                return date('Y-m-d', strtotime('now')).' 23:59:59';
                break;
            case 'timezone_offset':
                return 0;
                break;
            case 'rows_limit': 
                return 6;
                break;
            case 'rows_offset':
                return 0;
                break;
            default: return null;
        }
    }
    // Set the filters
    private function setFilters($filters_inputs){
        $filters = session('transactions_filters', []);
        foreach($filters_inputs as $key => $value){
            // If the value of the filter is the default, set the default value
            $filters[$key] = ($value === 'default' ?
                $this->setDefaultFilters($key) : $value
            );
        }

        session(['transactions_filters' => $filters]);
    }
    // Format local time to UTC
    private function formatToUTC($time, $timezone_offset){
        return date('Y-m-d H:i:s',
            strtotime($time) + ($timezone_offset * 60)             
        );    
    }

    private function setSelectQueries($filters_names = 'all'){
        $filters = session('transactions_filters', []);

        if($filters_names === 'all' || !empty($filters_names)){
            if($filters_names === 'all' || in_array('store_id', $filters_names)){
                $this->select_queries['queries'] .= ' AND transactions.store_id=?';
                $this->select_queries['par'][] = $filters['store_id'];
            }
            if($filters_names === 'all' || in_array('transaction_times', $filters_names)){
                $transactions_start_time = '"'.$this->formatToUTC(
                    $filters['transactions_start_time'],
                    $filters['timezone_offset']
                ).'"';
                $transactions_end_time = '"'.$this->formatToUTC(
                    $filters['transactions_end_time'],
                    $filters['timezone_offset']
                ).'"';                
                $this->select_queries['queries'] .= 
                ' AND (transactions.transaction_time BETWEEN '.
                $transactions_start_time.' AND '.$transactions_end_time.')';
            }

            $this->select_queries['queries'] .= ' ORDER BY transactions.id DESC';

            if($filters_names === 'all' || in_array('rows_limit_offset', $filters_names)){
                $this->select_queries['queries'] .= ' LIMIT ?,?';
                array_push(
                    $this->select_queries['par'],
                    $filters['rows_offset'], $filters['rows_limit']
                );                
            }
        }
    }

    public function index($filters_inputs){
        $this->setFilters($filters_inputs);
        $this->setSelectQueries('all');  
        return DB::select(
            $this->select_queries['queries'],$this->select_queries['par']
        );
    }

	public function get($id){
        return DB::select(
            $this->select_queries['queries'].' AND transactions.id=?',
            [$id]
        );
	}

    public function store($data){
        $Stores = new Stores();
        // Set value for items_details column
        $items_details = [];
        // Set value for cost_details column
        $cost_details = [
            'total_items_sold' => 0,
            'total_production_prices' => 0,
            'total_original' => 0,
            'total' => 0,
            'profit_original' => 0,
            'profit' => 0,            
        ];
        // Set value for payment_details
        $payment_details = json_decode($data['payment_details'],true);
        $payment_details['date'] = $this->formatToUTC(
            $payment_details['date'], $data['timezone_offset']
        ); 
        // Set value for transaction_time
        $transaction_time = $this->formatToUTC(
            $data['transaction_time'], $data['timezone_offset']
        );
        // Set value for the updated items in the store
        $updtd_items_in_store = [];  
        $items = json_decode($data['items'], true);

        foreach($items as $id => $sizes){
            // Get the item in the store
            $item_on_store = $Stores->getItem($data['store_id'], $id)[0];
            $item_on_store->store_items = json_decode(
                $item_on_store->store_items, true
            );
            $item_on_store->item_production_price = json_decode(
                $item_on_store->item_production_price, true
            );
            $item_on_store->item_selling_price = json_decode(
                $item_on_store->item_selling_price, true
            );                     
            // Save the item for updating
            $updtd_items_in_store[$id] = [];

            $items_details[$id] = [
                'name' => $item_on_store->item_name,
                'details' => [],
            ];

            foreach($sizes as $size => $details){
                $items_details[$id]['details'][$size] = [
                    'quantity' => $details['quantity'],
                    'production_price' => $item_on_store->item_production_price[$size],
                    'selling_price' => $item_on_store->item_selling_price[$size],
                    'custom_price' => $details['custom_price'],
                ];

                // Update the item in the store
                $updtd_items_in_store[$id][$size] = [
                    'quantity' => $item_on_store->store_items[$id][$size]['quantity']
                        - $details['quantity']
                ];
                $cost_details['total_items_sold'] += $details['quantity'];
                $cost_details['total_production_prices'] += ($details['quantity'] *
                    $item_on_store->item_production_price[$size]);
                $cost_details['total_original'] += ($item_on_store->item_selling_price[$size]
                    * $details['quantity']);
                $cost_details['total'] += ($details['custom_price'] !== null ?
                    ($details['custom_price'] * $details['quantity']) :
                    ($item_on_store->item_selling_price[$size] * $details['quantity'])
                );                                  
            }
        }
        $cost_details['profit_original'] = ($cost_details['total_original'] -
            $cost_details['total_production_prices']);
        $cost_details['profit'] = ($cost_details['total'] -
            $cost_details['total_production_prices']);         
        // Store the new transaction
        DB::insert(
            'INSERT INTO transactions(
                costumer_name,store_id,items_details,cost_details,
                payment_details,transaction_time,employee_id,
                created_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?)',[
                $data['costumer_name'],$data['store_id'], json_encode($items_details, true),
                json_encode($cost_details, true), json_encode([$payment_details], true),
                $transaction_time, $data['employee_id'],
                $this->current_time, $this->current_time
            ]
        );
        // Get the transaction ID
        $transaction_id = DB::select('SELECT LAST_INSERT_ID() AS id FROM transactions')[0]->id;
        // Update the items in the store
        $Stores->updateItem($data['store_id'], json_encode($updtd_items_in_store, true));
        // Store the transaction ID to incomplete transactions table if the transaction
        // is incomplete     
        if($payment_details['amount'] < $cost_details['total']){
            DB::insert('INSERT INTO incomplete_transactions VALUES(?)',[$transaction_id]);
        }
    }

    public function update($id, $data){
		// Format the updates for update
		$updates_placeholders = [];
		$updates_values = [];
        $column_names = [
            'costumer_name','store_id','items_details',
            'cost_details','payment_details','transaction_time','employee_id '
        ];

		foreach($data as $col_name => $value){
            if(in_array($col_name, $column_names)){
                $updates_placeholders[] = $col_name.'=?';
                if($col_name === 'payment_details'){
                    $updates_values[] = $this->addPayment(
                        $id, $data['payment_details'],$data['timezone_offset']
                    );
                }
                else{
                    $updates_values[] = $value;
                }                
            }
		}
		$updates_placeholders[] = 'updated_at=?';
		array_push($updates_values, $this->current_time, $id);

		// Update the stores
		DB::update(
			'UPDATE transactions SET '.implode(',', $updates_placeholders).' WHERE id=?',
			array_merge($updates_values)
		);
    }
	
    public function delete($id){
		DB::delete(
			'DELETE FROM incomplete_transactions WHERE transaction_id=?',[$id]
		);          
		DB::delete(
			'DELETE FROM transactions WHERE id=?',[$id]
		);      
		return $id;    
    }

    public function load(){
        $filters = session('transactions_filters', []);
        $rows_offset = $filters['rows_offset'] + $filters['rows_limit'];
        $this->setFilters(['rows_offset' => $rows_offset]);
        $this->setSelectQueries('all');

        return DB::select(
            $this->select_queries['queries'],$this->select_queries['par']
        );
    }

    private function addPayment($transaction_id, $new_payment, $timezone_offset){
        $transaction = $this->get($transaction_id)[0];
        $transaction->payment_details = json_decode($transaction->payment_details, true);
        $transaction->cost_details = json_decode($transaction->cost_details, true);

        $new_payment = json_decode($new_payment, true);
        $new_payment['date'] = $this->formatToUTC($new_payment['date'], $timezone_offset);
        // Add new payment to payment details
        $transaction->payment_details[] = $new_payment;
        // Count the total paid
        $total_paid = 0;
        foreach($transaction->payment_details as $payment_detail){
            $total_paid += $payment_detail['amount'];
        }        

        if($total_paid >= $transaction->cost_details['total']){
            DB::delete(
                'DELETE FROM incomplete_transactions WHERE transaction_id=?',
                [$transaction_id]
            );
        }
        return json_encode($transaction->payment_details, true);
    }

    // Get the statistics of the transactions
    public function getStatistics($store_id, $from, $untill, $timezone_offset){
        $from = '"'.$this->formatToUTC($from, $timezone_offset).'"';
        $untill = '"'.$this->formatToUTC($untill, $timezone_offset).'"';

        $statistics = DB::select(
            'SELECT
            SUM(JSON_EXTRACT(cost_details, ?)) AS profit,
            SUM(JSON_EXTRACT(cost_details, ?)) AS total_income,
            SUM(JSON_EXTRACT(cost_details, ?)) AS total_items_sold
            FROM transactions WHERE deleted_at IS NULL AND store_id=?
            AND (transaction_time BETWEEN '.$from.' AND '.$untill.')',
            ['$.profit','$.total','$.total_items_sold',$store_id]
        )[0];

        return json_decode(json_encode($statistics, true), true);

    }

    public function indexIncompleteTrasactions(){
        return DB::select(
            'SELECT transactions.id AS id,
            transactions.costumer_name AS costumer_name,
            transactions.store_id AS store_id,
            transactions.items_details AS items_details,
            transactions.cost_details AS cost_details,
            transactions.payment_details AS payment_details,
            transactions.transaction_time AS transaction_time,
            transactions.employee_id AS employee_id,
            stores.name AS store_name,
            employees.name AS employee_name
            FROM transactions
            INNER JOIN incomplete_transactions ON 
            incomplete_transactions.transaction_id=transactions.id
            INNER JOIN employees ON transactions.employee_id=employees.id
            INNER JOIN stores ON transactions.store_id=stores.id
        ');
    }
}
