<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class Employee extends Authenticatable
{
    use Notifiable;

    protected $table = 'employees';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    
    protected $fillable = [
        'name', 'email', 'password', 'profile_settings',
        'store_id', 'created_at', 'updated_at'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getUserTable(){
        return $this->table;
    }

    public function index(){
        return 
        $this->select(
            'employees.id AS id','employees.name AS name','employees.email AS email',
            'employees.profile_settings AS profile_settings', 'employees.store_id AS store_id',
            'stores.name AS store_name', 'employees.created_at AS created_at'
        )
        ->join('stores', 'employees.store_id', '=', 'stores.id')
        ->where('employees.deleted_at', null)
        ->orderBy('employees.id', 'desc')->get();
    }    

    public function add($data){
        // Set created_at and updated_at column value
        $current_time = date("Y-m-d H:i:s", time());
        // Set default profile picture
        $data['profile_settings']['profile_picture'] = 'user_default_thumbnail.jpg';

        $employee =  $this->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'profile_settings' => json_encode($data['profile_settings']),
            'store_id' => $data['store_id'],
            'created_at' => $current_time,
            'updated_at' => $current_time,
        ]);

        $employee_disk = Storage::disk('employees');
        $employee_disk->makeDirectory($employee->id);

        File::copy(
            public_path('images/user_default_thumbnail.jpg'),
            $employee_disk->path($employee->id.'/'.$data['profile_settings']['profile_picture'])
        );

        return $employee;
    }

    public function updateProfile($data){
        $updated_data = [
            'name' => $data['name'],
            'updated_at' => date("Y-m-d H:i:s", time()),
        ];

        if(isset($data['password'])){
            $updated_data['password'] = Hash::make($data['password']);
        }

        $this->where('id', $data['id'])->update($updated_data);

        // Remove unnecessary data to be returned
        unset($updated_data['password']);
        unset($updated_data['updated_at']);

        return $updated_data;
    }
    
    public function remove($id){
        $updated_at = date("Y-m-d H:i:s", time());
        
        $this->where('id', $id)->update([
            'updated_at' => $updated_at,
            'deleted_at' => $updated_at
        ]);

        return $id;
    }        
}
