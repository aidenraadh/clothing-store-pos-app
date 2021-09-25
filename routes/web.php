<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\IndexController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemsStorageController;
use App\Http\Controllers\ItemsTransferLogController;
use App\Http\Controllers\StoresController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\TransactionsController;

// use App\Models\Admin;
use App\Models\Transactions;


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', [IndexController::class, 'index'])
	->middleware('guest');


/* Route::get('add-admin', function(Admin $Admin){
	$data = [
		'name' => 'Robert',
		'email' => 'robert@gmail.com ',
		'password' => 12345678,
	];
	$Admin->add($data);
	return 'Admin added.';
}); */
function test(...$x){
	dd(...$x);
}

Route::get('test', function(Transactions $Transactions){
	$x = ['asd' => 1];
	test($x);
});

Route::prefix('admin')->group(function () {
	Route::get('app', [IndexController::class, 'admin'])
		->middleware('auth:admin')
		->name('admin.app');

	Route::post('dashboard', DashboardController::class)
		->middleware('auth:admin')
		->name('admin.dashboard');		
		
	Route::post('items-storage', [ItemsStorageController::class, 'index'])
		->middleware('auth:admin')
		->name('admin.index_items_storage');

	Route::post('items-storage/load', [ItemsStorageController::class, 'load'])
		->middleware('auth:admin')
		->name('admin.load_items_storage');		
		
	Route::post('items-storage/store', [ItemsStorageController::class, 'store'])
		->middleware('auth:admin')
		->name('admin.store_items_storage');

	Route::post('items-storage/get', [ItemsStorageController::class, 'get'])
		->middleware('auth:admin')
		->name('admin.get_items_storage');		

	Route::post('items-storage/update', [ItemsStorageController::class, 'update'])
		->middleware('auth:admin')
		->name('admin.update_items_storage');

	Route::post('items-storage/delete', [ItemsStorageController::class, 'delete'])
		->middleware('auth:admin')
		->name('admin.delete_items_storage');
		
	Route::post('items-storage/search', [ItemsStorageController::class, 'search'])
		->middleware('auth:admin')
		->name('admin.search_items_storage');

		
	Route::post('items-transfer-log', [ItemsTransferLogController::class, 'index'])
		->middleware('auth:admin')
		->name('admin.index_items_transfer_log');
		
	Route::post('items-transfer-log/load', [ItemsTransferLogController::class, 'load'])
		->middleware('auth:admin')
		->name('admin.load_items_transfer_log');			
		

	Route::post('stores', [StoresController::class, 'index'])
		->middleware('auth:admin')
		->name('admin.index_stores');

	Route::post('stores/index', [StoresController::class, 'indexStoresOnly'])
		->middleware('auth:admin')
		->name('admin.index_stores_only');			

	Route::post('stores/store', [StoresController::class, 'store'])
		->middleware('auth:admin')
		->name('admin.store_stores');	

	Route::post('stores/update', [StoresController::class, 'update'])
		->middleware('auth:admin')
		->name('admin.update_stores');

	Route::post('stores/delete', [StoresController::class, 'delete'])
		->middleware('auth:admin')
		->name('admin.delete_stores');

	Route::post('stores/get-item', [StoresController::class, 'getItem'])
		->middleware('auth:admin')
		->name('admin.get_store_item');

	Route::post('stores/load-items', [StoresController::class, 'loadItems'])
		->middleware('auth:admin')
		->name('admin.load_store_items');			

	Route::post('stores/update-items', [StoresController::class, 'updateItem'])
		->middleware('auth:admin')
		->name('admin.update_store_items');


	Route::post('transactions', [TransactionsController::class, 'index'])
		->middleware('auth:admin')
		->name('admin.index_transactions');
		
	Route::post('transactions/delete', [TransactionsController::class, 'delete'])
		->middleware('auth:admin')
		->name('admin.delete_transactions');

	Route::post('transactions/load', [TransactionsController::class, 'load'])
		->middleware('auth:admin')
		->name('admin.load_transactions');	

	Route::post('users', [UsersController::class, 'index'])
		->middleware('auth:admin')
		->name('admin.index_users');

	Route::post('users/store', [UsersController::class, 'store'])
		->middleware('auth:admin')
		->name('admin.store_users');

	Route::post('users/update', [UsersController::class, 'update'])
		->middleware('auth:admin')
		->name('admin.update_users');

	Route::post('users/delete', [UsersController::class, 'delete'])
		->middleware('auth:admin')
		->name('admin.delete_users');								
});

Route::prefix('employee')->group(function () {
	Route::get('app', [IndexController::class, 'employee'])
		->middleware('auth:employee')
		->name('employee.app');

	Route::post('users/update', [UsersController::class, 'update'])
		->middleware('auth:employee')
		->name('employee.update_users');


	Route::post('items-storage/search', [ItemsStorageController::class, 'search'])
		->middleware('auth:employee')
		->name('employee.search_items_storage');		


	Route::post('stores', [StoresController::class, 'index'])
		->middleware('auth:employee')
		->name('employee.index_stores');

	Route::post('stores/load-items', [StoresController::class, 'loadItems'])
		->middleware('auth:employee')
		->name('employee.load_store_items');		

	Route::post('stores/get-item', [StoresController::class, 'getItem'])
		->middleware('auth:employee')
		->name('employee.get_store_item');
		
	Route::post('stores/transfer-items', [StoresController::class, 'transferItems'])
		->middleware('auth:employee')
		->name('employee.transfer_store_items');	
			

	Route::post('transactions', [TransactionsController::class, 'index'])
		->middleware('auth:employee')
		->name('employee.index_transactions');

	Route::post('transactions/store', [TransactionsController::class, 'store'])
		->middleware('auth:employee')
		->name('employee.store_transactions');
		
	Route::post('transactions/update', [TransactionsController::class, 'update'])
		->middleware('auth:employee')
		->name('employee.update_transactions');			
		
	Route::post('transactions/delete', [TransactionsController::class, 'delete'])
		->middleware('auth:employee')
		->name('employee.delete_transactions');

	Route::post('transactions/load', [TransactionsController::class, 'load'])
		->middleware('auth:employee')
		->name('employee.load_transactions');		
});

require __DIR__.'/auth.php';