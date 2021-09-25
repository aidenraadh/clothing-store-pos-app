<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Stores;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(Stores $Stores)
    {
        $Stores->store([
            'name' => 'Toko 1',
            'active_store' => 1,
        ]);
        $Stores->store([
            'name' => 'Gudang',
            'active_store' => 0,
        ]);        
    }
}
