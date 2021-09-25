<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStoresTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->smallIncrements('id');
            // Store name
            $table->string('name', 50);
            // Boolean, 0 if the store is not active (cannot no transaction)
            // 1 if the store is active (can conduct transaction)
            $table->unsignedTinyInteger('active_store');
            // All items with its quantities inside the store
            $table->json('items')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        /*
        items structure:
        {
            item_id: {
                s: {
                    quantity: 12,
                    selling_price: 3000,
                },
                l: {
                    quantity: 12,
                    selling_price: 3000,
                },                
            },
        }
        */
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('stores');
    }
}
