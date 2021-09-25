<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Stores;
use App\Models\Transactions;

use Illuminate\Support\Facades\Validator;

class DashboardController extends Controller
{
    public function __invoke(Request $request, Stores $Stores, Transactions $Transactions){
        $validator = Validator::make($request->all(), [
            'statistics_start_time' => [
                'bail',
                'required_with_all:statistics_end_time,
                timezone_offset',
                'before_or_equal:'.$request->statistics_end_time,
                'date'
            ],
            'statistics_end_time' => [
                'bail',
                'required_with_all:statistics_start_time,
                timezone_offset',
                'after_or_equal:'.$request->statistics_start_time,              
                'date'             
            ],
            'timezone_offset' => [
                'bail',
                'required_with_all:statistics_start_time,
                statistics_end_time',                
                'integer'                
            ],
        ],[
            'statistics_start_time.date' => 'Tanggal awal harus diisi',
            'statistics_end_time.date' => 'Tanggal akhir harus diisi',
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }
        // Set the filters, if the filter not exists,
        // set the default value
        $filters = session('statistics_filters', []);

        $filters['statistics_start_time'] = $request->input(
            'statistics_start_time',
            date('Y-m-d', strtotime('-1 week')).' 00:00:00'
        );
        $filters['statistics_end_time'] = $request->input(
            'statistics_end_time',
            date('Y-m-d', strtotime('now')).' 23:59:59'
        );
        $filters['timezone_offset'] = $request->input(
            'timezone_offset', 0
        );
        session(['statistics_filters', $filters]);
        // Get all stores
        $all_stores = $Stores->index();
        // Prepare total production prices for all stores
        $total_production_prices = [];
        // Prepare transactions statistics for all active stores
        $transactions = [];

        foreach($all_stores as $store){
            $total_production_prices[$store->name] = $Stores
                ->getStatistics($store->id)['total_production_prices'];

            if($store->active_store){
                $transactions[$store->name] = $Transactions
                    ->getStatistics(
                        $store->id,
                        $filters['statistics_start_time'],
                        $filters['statistics_end_time'],
                        $filters['timezone_offset']
                    ); 
            }               
        }
        return [
            'total_production_prices' => $total_production_prices,
            'transactions' => $transactions,
            'filters' => $filters,
        ];
    }
}
