<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Admin;
use App\Models\Employee;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Store admin
        (new Admin())->add([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => '12345678',            
        ]);
        // Store employee
        (new Employee())->add([
            'name' => 'Employee',
            'email' => 'employee@gmail.com',
            'password' => '12345678',            
            'store_id' => 1,   
        ]);        
    }
}
