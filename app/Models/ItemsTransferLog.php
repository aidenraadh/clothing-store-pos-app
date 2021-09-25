<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;

class ItemsTransferLog
{
    private $current_time;
    private $index_query = [
        'query' => (
            'SELECT
            items_transfer_log.item_id AS item_id,
            items_transfer_log.quantities AS quantities,
            items_transfer_log.origin_store_id AS origin_store_id,
            items_transfer_log.target_store_id AS target_store_id,
            items_transfer_log.employee_id AS employee_id,
            items_transfer_log.added_at AS added_at,
            items_storage.name AS item_name,
            origin_store.name AS origin_store_name,
            target_store.name AS target_store_name,
            employees.name AS employee_name
            FROM items_transfer_log
            INNER JOIN items_storage ON items_transfer_log.item_id=items_storage.id
            INNER JOIN stores AS origin_store ON items_transfer_log.origin_store_id=origin_store.id
            INNER JOIN stores AS target_store ON items_transfer_log.target_store_id=target_store.id            
            INNER JOIN employees ON items_transfer_log.employee_id=employees.id'            
        ),
        'par' => []
    ];
    public function __construct(){
        $this->current_time = date("Y-m-d H:i:s", time()); 
    }

    private function setDefaultIndexFilters($filter_key){
        switch($filter_key){
            case 'origin_store_id': 
                return 'all'; // Means from all store
                break;
            case 'target_store_id': 
                return 'all'; // Means from all store
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
    private function setIndexFilters($filters_inputs){
        $filters = session('items_transfer_log_filters', []);
        foreach($filters_inputs as $key => $value){
            // If the value of the filter is the default, set the default value
            $filters[$key] = ($value === 'default' ?
                $this->setDefaultIndexFilters($key) : $value
            );
        }
        session(['items_transfer_log_filters' => $filters]);
    }	

    private function setIndexQuery($filters_names = 'all'){
        $filters = session('items_transfer_log_filters', []);

        if($filters_names === 'all' || !empty($filters_names)){
            if($filters_names === 'all' || in_array('transfer_direction', $filters_names)){
                // When both origin and target store ID is all
                if($filters['origin_store_id'] !== 'all' && $filters['target_store_id'] !== 'all'){
                    $this->index_query['query'] .= ' WHERE origin_store_id=? 
                        AND target_store_id=?';
                    array_push(
                        $this->index_query['par'],
                        $filters['origin_store_id'], $filters['target_store_id']
                    );                    
                }
                // When only origin store ID is not all
                else if(
                    $filters['origin_store_id'] !== 'all' && $filters['target_store_id'] === 'all'
                ){
                    $this->index_query['query'] .= ' WHERE origin_store_id=?';
                    array_push(
                        $this->index_query['par'],$filters['origin_store_id'],
                    );  
                }
                // When only target store ID is not all
                else if(
                    !$filters['origin_store_id'] === 'all' && $filters['target_store_id'] !== 'all'
                ){
                    $this->index_query['query'] .= ' WHERE target_store_id=?';
                    array_push(
                        $this->index_query['par'],$filters['target_store_id'],
                    );  
                }
            }            

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

    public function store($data){
        DB::insert(
            'INSERT INTO items_transfer_log(
                item_id,quantities,origin_store_id,
                target_store_id,employee_id,added_at
            )
            VALUES(?,?,?,?,?,?)',[
                $data['item_id'],$data['quantities'],$data['origin_store_id'],
                $data['target_store_id'],$data['employee_id'],
                $this->current_time
            ]
        );
    }

    public function load(){
        $filters = session('items_transfer_log_filters', []);
        $rows_offset = $filters['rows_offset'] + $filters['rows_limit'];
        $this->setIndexFilters(['rows_offset' => $rows_offset]);
        $this->setIndexQuery('all');

        return DB::select(
            $this->index_query['query'],$this->index_query['par']
        );
    }	    
}
