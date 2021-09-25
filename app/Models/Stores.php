<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;

class Stores
{
    private $current_time;
	private $index_items_query = [
		'query' =>
			'SELECT 
			stores.items AS store_items,
			items_storage.id AS item_id,
			items_storage.name AS item_name,
			items_storage.production_prices AS item_production_price,
			items_storage.selling_prices AS item_selling_price
			FROM stores INNER JOIN items_storage
			ON JSON_SEARCH(JSON_KEYS(stores.items), "one", items_storage.id) IS NOT NULL',
		'par' => []
	];

    public function __construct(){
        $this->current_time = date("Y-m-d H:i:s", time()); 
    }

    public function index($active_only = false){
		if($active_only){
			return DB::select(
				'SELECT id,name,items,active_store FROM stores WHERE active_store=?
				AND deleted_at IS NULL ORDER BY id DESC', [1]
			);
		}
		return DB::select(
			'SELECT id,name,active_store FROM stores 
			WHERE deleted_at IS NULL ORDER BY id DESC'
		);
    }

	public function get($id){
		return DB::select(
			'SELECT id,name,items,active_store,created_at FROM stores 
			WHERE id=? AND deleted_at IS NULL',
			[$id]
		);
	}

    public function store($data){
        DB::insert(
			'INSERT INTO stores(name,active_store,created_at,updated_at) 
			VALUES(?,?,?,?)',
			[
				$data['name'],$data['active_store'],
				$this->current_time,$this->current_time
			]
		);
		$store_id = DB::select(
			'SELECT id FROM stores WHERE created_at=? LIMIT 1',
			[$this->current_time]
		)[0]->id;
		
		return $store_id;
    }

    public function update($id, $data){
		// Format the updates for update
		$updates_placeholders = [];
		$updates_values = [];

		foreach($data as $col_name => $value){
			$updates_placeholders[] = $col_name.'=?';
			$updates_values[] = $value;
		}
		$updates_placeholders[] = 'updated_at=?';
		array_push($updates_values, $this->current_time, $id);

		// Update the stores
		DB::update(
			'UPDATE stores SET '.implode(',', $updates_placeholders).' WHERE id=?',
			array_merge($updates_values)
		);
    }
	
    public function delete($id){
		DB::update(
			'UPDATE stores SET updated_at=?,deleted_at=? WHERE id=?',
			[$this->current_time,$this->current_time, $id]
		);
    }

    // Set the table filters for indexing a store's items
    // Structure:
    // $index_store_filters = [
    //     'store_id' => 3, // int, the store ID
    // ];

    private function setDefaultStoreItemsFilters($filter_key){
        switch($filter_key){
            case 'store_id': 
                $default_store_id = $this->index();
                
                return (empty($default_store_id) ? 
                    '' : $default_store_id[0]->id
                );
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
    private function setStoreItemsFilters($filters_inputs){
        $filters = session('store_items_filters', []);
        foreach($filters_inputs as $key => $value){
            // If the value of the filter is the default, set the default value
            $filters[$key] = ($value === 'default' ?
                $this->setDefaultStoreItemsFilters($key) : $value
            );
        }
        session(['store_items_filters' => $filters]);
    }

    private function setStoreItemsQueries($filters_names = 'all'){
        $filters = session('store_items_filters', []);

        if($filters_names === 'all' || !empty($filters_names)){
            if($filters_names === 'all' || in_array('store_id', $filters_names)){
                $this->index_items_query['query'] .= ' WHERE stores.id=?';
                $this->index_items_query['par'][] = $filters['store_id'];
            }
            $this->index_items_query['query'] .= ' ORDER BY items_storage.id DESC';

            if($filters_names === 'all' || in_array('rows_limit_offset', $filters_names)){
                $this->index_items_query['query'] .= ' LIMIT ?,?';
                array_push(
                    $this->index_items_query['par'],
                    $filters['rows_offset'], $filters['rows_limit']
                );                
            }
        }
    }	

	public function indexItems($filters_inputs){
        $this->setStoreItemsFilters($filters_inputs);
        $this->setStoreItemsQueries('all');  
        return DB::select(
			$this->index_items_query['query'],
			$this->index_items_query['par']
		);
	}

	public function getItem($store_id, $item_id){
        return DB::select(
            $this->index_items_query['query'].' WHERE stores.id=? 
			AND items_storage.id=? LIMIT 1',
            [$store_id, $item_id]
        );		
	}

    public function loadItems(){
        $filters = session('store_items_filters', []);
        $rows_offset = $filters['rows_offset'] + $filters['rows_limit'];
        $this->setStoreItemsFilters(['rows_offset' => $rows_offset]);
        $this->setStoreItemsQueries('all');

        return DB::select(
            $this->index_items_query['query'],$this->index_items_query['par']
        );
    }	
	
	public function updateItem($store_id, $items){
		$items = json_decode($items, true);
		// Get all items and active store statis from the store
		$store = DB::select("SELECT items,active_store FROM stores WHERE id=?",[$store_id])[0];
		$active_store = $store->active_store;
		$store_items = json_decode($store->items, true);
		// If the store's items are null
		if($store_items === null){
			$store_items = [];
		}
		foreach($items as $id => $data){
			// If the item is not stored yet in the store
			if(!isset($store_items[$id])){
				$store_items[$id] = [];
			}
			foreach($data as $size => $details){
				// If the item size is not stored yet in the store
				if(!isset($store_items[$id][$size])){
					$store_items[$id][$size] = ['quantity' => 0];
				}
				$store_items[$id][$size] = array_replace(
					$store_items[$id][$size], $details
				);
				$store_items[$id][$size]['updated_at'] = $this->current_time;
			}		
		}
		
		DB::update(
			'UPDATE stores SET items=?,updated_at=? WHERE id=?',
			[
				// Encode store items to JSON only if it is not null
				(empty($store_items) ?  NULL : json_encode($store_items, true)),
				$this->current_time,
				$store_id
			]
		);
	}	

	// Transfer items between stores or between store
	public function transferItems($item_id, $quantities, $origin_store_id, $target_store_id){
		$quantities = json_decode($quantities, true);	
		
		$formatItem = function($item_id, $quantities, $store_id, $is_origin = true){
        	// Get the item data on the store
        	$item_data = DB::select('
				SELECT JSON_EXTRACT(items, ?) AS item_data
        	    FROM stores WHERE id=?',
        	    ['$.'.$item_id, $store_id]
			)[0]->item_data;
			$item_data = json_decode($item_data, true);	

			$formatted_item = [$item_id => []];

			foreach($quantities as $size => $quantity){
				// If the store is the origin store
				if($is_origin){
					$formatted_item[$item_id][$size] = [
						'quantity' => ($item_data[$size]['quantity'] - $quantity)
					];
				}
				// If the store is the target store
				else{
					$formatted_item[$item_id][$size] = [
						'quantity' => (
							$item_data !== null && isset($item_data[$size]) ? 
							$item_data[$size]['quantity'] : 0
						) + $quantity,
					];
				}
			}
			return json_encode($formatted_item, true);
		};
		// Update the item on the origin store
		$this->updateItem(
			$origin_store_id,
			$formatItem($item_id, $quantities, $origin_store_id)
		);
		// Update the item on the target store
		$this->updateItem(
			$target_store_id,
			$formatItem($item_id, $quantities, $target_store_id, false)
		);		
	}

	// Remove an item from a store
	public function deleteItem($item_id, $store_id = 'all'){
		if($store_id = 'all'){
			DB::update(
				'UPDATE stores SET items=JSON_REMOVE(items, ?),updated_at=? 
				WHERE deleted_at IS NULL', 
				['$.'.$item_id, $this->current_time]
			);
		}
		else{
			DB::update(
				'UPDATE stores SET items=JSON_REMOVE(items, ?),updated_at=? WHERE id=?',
				['$.'.$item_id, $this->current_time, $store_id]
			);
		}
	}	

	public function getStatistics($store_id){
		$rows = DB::select(
			'SELECT
			items_storage.id AS item_id,
			items_storage.production_prices,
			stores.items AS store_items
			FROM items_storage INNER JOIN stores 
			ON JSON_SEARCH(JSON_KEYS(stores.items), "one", items_storage.id) IS NOT NULL
			WHERE stores.id=?',
			[$store_id]
		);
		// Total items stored
		$total_items_stored = 0;
		// Total production prices
		$total_production_prices = 0;
	
		foreach($rows as $row){
			$item_id = $row->item_id;
			$item_data_on_store = json_decode($row->store_items, true)[$item_id];
			$production_prices = (
				$row->production_prices ?
				json_decode($row->production_prices, true) : null
			);
			
			foreach($item_data_on_store as $size => $data){
				$total_items_stored += $data['quantity'];
				// If the production price of the size is set
				// Save the total production price
				if(isset($production_prices[$size])){
					$total_production_prices += $production_prices[$size] * 
						$data['quantity'];
				}
			}
		}
		return [
			'total_items_stored' => $total_items_stored,
			'total_production_prices' => $total_production_prices
		];
	}
}
