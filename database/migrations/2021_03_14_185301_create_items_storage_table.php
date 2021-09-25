<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateItemsStorageTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('items_storage', function (Blueprint $table) {
            $table->id();
            // The name of the item
            $table->string('name', 50)->unique();
            // The item's production prices per sizes
            $table->json('production_prices')->nullable();
            $table->json('selling_prices')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('items_storage');
    }
}
