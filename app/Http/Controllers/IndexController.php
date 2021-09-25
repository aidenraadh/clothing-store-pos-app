<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Stores;

use Illuminate\Support\Facades\Auth;

class IndexController extends Controller
{
    public function index(Stores $Stores){
        return view('landing', ['stores' => $Stores->index(true)]);
    }
    public function admin(){
        $user = Auth::user();

        return view('admin-app', [
            'view_data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                    'guard' => 'admin',
                ],
                'urls' => [
                    'app' => config('app.url'),
                    'images' => asset('images'),

                    'dashboard' => route('admin.dashboard'),

                    'index_items_storage' => route('admin.index_items_storage'),
                    'load_items_storage' => route('admin.load_items_storage'),
                    'store_items_storage' => route('admin.store_items_storage'),
                    'get_items_storage' => route('admin.get_items_storage'),
                    'update_items_storage' => route('admin.update_items_storage'),
                    'delete_items_storage' => route('admin.delete_items_storage'),
                    'search_items_storage' => route('admin.search_items_storage'),
                    
                    'index_items_transfer_log' => route('admin.index_items_transfer_log'),
                    'load_items_transfer_log' => route('admin.load_items_transfer_log'),

                    'index_stores' => route('admin.index_stores'),
                    'store_stores' => route('admin.store_stores'),
                    'update_stores' => route('admin.update_stores'),
                    'delete_stores' => route('admin.delete_stores'),
                    'get_store_item' => route('admin.get_store_item'),
                    'load_store_items' => route('admin.load_store_items'),
                    'update_store_items' => route('admin.update_store_items'),

                    'index_transactions' => route('admin.index_transactions'),
                    'load_transactions' => route('admin.load_transactions'),
                    'delete_transactions' => route('admin.delete_transactions'),
                    
                    'index_users' => route('admin.index_users'),
                    'store_users' => route('admin.store_users'),
                    'update_users' => route('admin.update_users'),
                    'delete_users' => route('admin.delete_users'),                    
                    'logout' => route('admin.logout'),  
                ],
                'csrf_token' => csrf_token(),
                'accepted_item_sizes' => config('app.accepted_item_sizes'),
            ],
        ]);
    }
    public function employee(Stores $Stores){
        $user = Auth::user();

        return view('employee-app', [
            'view_data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'store' => $Stores->get($user->store_id)[0],
                    'created_at' => $user->created_at,
                    'guard' => 'employee',
                ],
                'urls' => [
                    'app' => config('app.url'),
                    'images' => asset('images'),

                    'search_items_storage' => route('employee.search_items_storage'),

                    'index_stores' => route('employee.index_stores'),
                    'load_store_items' => route('employee.load_store_items'),
                    'get_store_item' => route('employee.get_store_item'),
                    'transfer_store_items' => route('employee.transfer_store_items'),

                    'index_transactions' => route('employee.index_transactions'),
                    'load_transactions' => route('employee.load_transactions'),
                    'store_transactions' => route('employee.store_transactions'),
                    'update_transactions' => route('employee.update_transactions'),                    

                    'update_users' => route('employee.update_users'),

                    'logout' => route('employee.logout'),  
                ],
                'csrf_token' => csrf_token(),
                'accepted_item_sizes' => config('app.accepted_item_sizes'),
            ],
        ]);        
    }    
}
