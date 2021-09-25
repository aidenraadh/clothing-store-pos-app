<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\ItemsStorage;

class ItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(ItemsStorage $ItemsStorage)
    {
        $ItemsStorage->store(json_encode([
            [
                'name' => 'Item 1',
                'production_prices' => [
                    'xs' => 50000, 's' => 50000, 'm' => 50000,
                    'l' => 80000, 'xl' => 80000, 'xxl' => 80000,
                    '3l' => 100000, '4l' => 100000, '5l' => 100000,
                ],
                'selling_prices' => [
                    'xs' => 60000, 's' => 60000, 'm' => 60000,
                    'l' => 90000, 'xl' => 90000, 'xxl' => 90000,
                    '3l' => 110000, '4l' => 110000, '5l' => 110000,
                ],                
            ],
            [
                'name' => 'Item 2',
                'production_prices' => [
                    'xs' => 50000, 's' => 50000, 'm' => 50000,
                    'l' => 80000, 'xl' => 80000, 'xxl' => 80000,
                    '3l' => 100000, '4l' => 100000, '5l' => 100000,
                ],
                'selling_prices' => [
                    'xs' => 60000, 's' => 60000, 'm' => 60000,
                    'l' => 90000, 'xl' => 90000, 'xxl' => 90000,
                    '3l' => 110000, '4l' => 110000, '5l' => 110000,
                ],                
            ],              
        ], true));
    }
}
