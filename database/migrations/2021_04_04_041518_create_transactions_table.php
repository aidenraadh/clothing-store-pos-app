<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('costumer_name', 30);
            $table->unsignedSmallInteger('store_id');
            $table->json('items_details');
            $table->json('cost_details');
            $table->json('payment_details');
            $table->timestamp('transaction_time');
            $table->unsignedSmallInteger('employee_id');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('store_id')->references('id')->on('stores');  
            $table->foreign('employee_id')->references('id')->on('employees');            
        });


        // Items details structure:
        // item_details = {
        //     item_id: {
        //         name: 'Item A',
        //         details: {
        //             s: {
        //                 quantity: 23, // The quantity of the item sold of size 'S'
        //                 selling_prices: 120000, // The selling price of the item sold of size 'S'
        //                 production_price: 123124, // The production prce of the item sold of size 'S'
        //                 custom_price: 213123 // The custom selling price of the item sold of size 'S'
        //             },
        //             l: {...},
        //             ...
        //         }               
        //     },
        //     ...        
        // };

        // Cost details structure:
        // cost_details = {
        //     total_production_price: 360000 // The total of the sold items' production price
        //     total_items_sold: 120, // The total amount sold items
        //     total_original: 20000, // The revenue of the transaction without custom price
        //     total: 20000, // The total amount transaction cost   
        // } 
        
        // Payment details structure:
        // payment_details = {
        //     date_of_payment: total_paid,
        //     ...
        // }          
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('transactions');
    }
}
