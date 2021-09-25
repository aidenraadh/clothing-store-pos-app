<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;


use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

use Illuminate\Validation\Rule;

use App\Rules\HTMLSpecialCharsRule;
use App\Rules\PasswordResetRule;

use App\Models\Admin;
use App\Models\Employee;
use App\Models\Stores;

class UsersController extends Controller
{
    private function getUserModel($user_type){
        switch($user_type){
            case 'admin': return new Admin(); break;
            case 'employee': return new Employee(); break;
            default: return null;
        }
    }
    public function index(Request $request){
        return response([
            'admins' => (new Admin)->index(),
            'employees' => (new Employee)->index(),
            'active_stores' => (new Stores)->index(true),
        ], 200);
    }
    
    public function store(Request $request){
        $UserModel = $this->getUserModel($request->user_type);
        if($UserModel === null){
            return response(['User type not found'], 400);
        }      

        $validated_values = [
            'name' => ['bail', 'required', 'string', 'max:30', new HTMLSpecialCharsRule()],
            'email' => [
                'bail', 'required', 'string', 'email', 'max:255',
                'unique:'.$UserModel->getUserTable(),
            ],
            'password' => ['bail', 'required', 'string', 'min:8', 'confirmed'],            
        ];
        if($request->user_type === 'employee'){
            $validated_values['store_id'] = [
                'bail', 'required', 'integer',
                Rule::exists('stores', 'id')->where(function($query){
                    return $query->where('deleted_at', null);
                }),                
            ];
        }

        $validator = Validator::make($request->all(), $validated_values);

        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }

        $user = $UserModel->add($request->all());
        $response = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_settings' => $user->profile_settings,
            'created_at' => $user->created_at            
        ];
        if($request->user_type === 'employee'){
            $response['store_id'] = $user->store_id;
            $response['store_name'] = $user->store_name;
        }

        return response([$response], 200);        
    }

    public function update(Request $request){
        $UserModel = null;
        $guards = config('auth.guards');
        foreach($guards as $guard_name => $data){
            if(Auth::guard($guard_name)->check()){
                $UserModel = $this->getUserModel($guard_name);
            }
        }
        if($UserModel === null){
            return response(['User type not found'], 400);
        } 
        // Get the old profile values
        $user = Auth::user();
        $old_values = [
            'old_name' => $user->name,
            'old_password' => $user->password,
        ];
        // Merge the new profile values with the old profile values
        $data = array_merge($request->all(), $old_values);
        // Save the user ID
        $data['id'] = $user->id;        

        $validator = Validator::make($data, [
            'name' => [
                'exclude_if:old_name,'.$data['name'], 'bail', 'required',
                'string', new HTMLSpecialCharsRule(),
            ],          
            'old_password_check' => [
                'required_with:password','bail', 'nullable', 'string',
                new PasswordResetRule($UserModel->getUserTable(), $user->id),
            ],
            'password' => [
                'required_with:old_password_check,password_confirmation', 'bail', 'nullable',
                'string', 'min:8', 'confirmed', 'notIn:'.$data['old_password_check']
            ],
        ]);
        if($validator->fails()){
            return response($validator->errors()->all(), 400);
        }

        return response($UserModel->updateProfile($data), 200);
    }

    public function delete(Request $request){
        $UserModel = $this->getUserModel($request->user_type);
        if($UserModel === null){
            return response(['User type not found'], 400);
        } 

        $validator = Validator::make($request->all(), [
            'id' => [
                'bail', 'required', 'integer',
                Rule::exists($UserModel->getUserTable())->where(function ($query) {
                    $query->where('deleted_at', null);
                }),             
            ],
        ]);

        if($validator->fails()){
            return response(
                ['Pegawai ini sudah dihapus. Refresh page anda.'], 400
            );
        }

        return response($UserModel->remove($request->id), 200);        
    }                  
}
