<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateItemsTransferLogTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('items_transfer_log', function (Blueprint $table) {
            $table->unsignedBigInteger('item_id');
            $table->json('quantities');
            $table->unsignedSmallInteger('origin_store_id')->nullable();
            $table->unsignedSmallInteger('target_store_id')->nullable();
            $table->unsignedSmallInteger('employee_id');
            $table->timestamp('added_at');

            $table->foreign('item_id')->references('id')->on('items_storage');
            $table->foreign('origin_store_id')->references('id')->on('stores');
            $table->foreign('target_store_id')->references('id')->on('stores');
            $table->foreign('employee_id')->references('id')->on('employees');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('items_transfer_log');
    }
}
