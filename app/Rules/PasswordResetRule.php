<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordResetRule implements Rule
{
    private $user_table;
    private $user_id;
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($user_table, $user_id)
    {
        $this->user_table = $user_table;
        $this->user_id = $user_id;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if(!Hash::check(
            $value,
            DB::select('SELECT password FROM '.$this->user_table.' WHERE id=?', [$this->user_id])
            [0]->password
        ))
        {
            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Your old password doesn't match";
    }
}
