<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;

class ItemsStorage
{
    private $current_time;
	private $index_query = [
		'query' => (
			'SELECT id,name,production_prices,selling_prices,created_at 
			FROM items_storage WHERE deleted_at IS NULL'			
		),
		'par' => []
	];

	private function sanitizeString($string){
		return preg_replace('/\s{2,}/', ' ', trim($string));
	}

    public function __construct(){
        $this->current_time = date("Y-m-d H:i:s", time()); 
    }

    private function setDefaultIndexFilters($filter_key){
        switch($filter_key){
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
    private function setIndexFilters($filters_inputs){
        $filters = session('storage_items_filters', []);
        foreach($filters_inputs as $key => $value){
            // If the value of the filter is the default, set the default value
            $filters[$key] = ($value === 'default' ?
                $this->setDefaultIndexFilters($key) : $value
            );
        }
        session(['storage_items_filters' => $filters]);
    }	

    private function setIndexQuery($filters_names = 'all'){
        $filters = session('storage_items_filters', []);

        if($filters_names === 'all' || !empty($filters_names)){
            $this->index_query['query'] .= ' ORDER BY id DESC';

            if($filters_names === 'all' || in_array('rows_limit_offset', $filters_names)){
                $this->index_query['query'] .= ' LIMIT ?,?';
                array_push(
                    $this->index_query['par'],
                    $filters['rows_offset'], $filters['rows_limit']
                );
            }
        }
    }		

    public function index($filters_inputs){
        $this->setIndexFilters($filters_inputs);
        $this->setIndexQuery('all');  
        return DB::select(
			$this->index_query['query'],
			$this->index_query['par']
		);
    }

	public function get($id){
		return DB::select(
			$this->index_query['query'].' AND id=?',
			[$id]
		);		
	}
	
    public function store($data){
		$items = json_decode($data, true);
		// Format the data for insertion
		$insertion_placeholders = [];
		$insertion_values = [];
		
		foreach($items as $key => $item){
			$insertion_placeholders[] = '(?,?,?,?,?)';
			array_push(
				$insertion_values,
				$this->sanitizeString($item['name']),
				(
					empty($item['production_prices']) ? 
					NULL : json_encode($item['production_prices'], true)
				),
				(
					empty($item['selling_prices']) ? 
					NULL : json_encode($item['selling_prices'], true)
				),				
				$this->current_time, $this->current_time
			);
		}
        DB::insert(
			'INSERT INTO items_storage(
				name,production_prices,selling_prices,created_at,updated_at
			) 
			VALUES '.implode(',', $insertion_placeholders), $insertion_values
		);
    }

    public function update($id, $data){
		$data = json_decode($data, true);
		// Format the updates for update
		$updates_placeholders = [];
		$updates_values = [];

		foreach($data as $col_name => $value){
			$updates_placeholders[] = $col_name.'=?';
			switch($col_name){
				case 'name':
					$updates_values[] = $this->sanitizeString($value);
					break;
				case 'production_prices':
					$updates_values[] = (empty($value) ? NULL : json_encode($value, true));
					break;
				case 'selling_prices':
					$updates_values[] = (empty($value) ? NULL : json_encode($value, true));
					break;					
				default: $updates_values[] = $value;
			}
		}
		$updates_placeholders[] = 'updated_at=?';
		array_push($updates_values, $this->current_time, $id);

		// Update the item
		DB::update(
			'UPDATE items_storage SET '.implode(',', $updates_placeholders).' WHERE id=?',
			array_merge($updates_values)
		);
    }

    public function delete($id){
		DB::delete(
			'DELETE FROM items_storage WHERE id=?',[$id]
		);
    }

	public function getByName($string){
		return DB::select(
			'SELECT id,name FROM items_storage WHERE name LIKE ?
			AND deleted_at IS NULL ORDER BY id DESC',
			[$string.'%']
		);		
	}
	
	public function load(){
        $filters = session('storage_items_filters', []);
        $rows_offset = $filters['rows_offset'] + $filters['rows_limit'];
        $this->setIndexFilters(['rows_offset' => $rows_offset]);
        $this->setIndexQuery('all');

        return DB::select(
            $this->index_query['query'],$this->index_query['par']
        );		
	}
}
