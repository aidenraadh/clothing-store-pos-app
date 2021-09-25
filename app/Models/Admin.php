<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class Admin extends Authenticatable
{
    use Notifiable;

    protected $table = 'admins';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    
    protected $fillable = [
        'name', 'email', 'password', 'profile_settings',
        'created_at', 'updated_at'
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
        return $this->select('id','name','email','profile_settings','created_at')
        ->orderBy('id', 'desc')->get();
    }    

    public function add($data){
        // Set created_at and updated_at column value
        $current_time = date("Y-m-d H:i:s", time());
        // Set default profile picture
        $data['profile_settings']['profile_picture'] = 'user_default_thumbnail.jpg';

        $admin =  $this->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'profile_settings' => json_encode($data['profile_settings']),
            'created_at' => $current_time,
            'updated_at' => $current_time,
        ]);

        $admins_disk = Storage::disk('admins');
        $admins_disk->makeDirectory($admin->id);

        File::copy(
            public_path('images/user_default_thumbnail.jpg'),
            $admins_disk->path($admin->id.'/'.$data['profile_settings']['profile_picture'])
        );

        return $admin;
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
}
