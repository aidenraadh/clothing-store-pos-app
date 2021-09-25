<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

/*
|--------------------------------------------------------------------------
| This rule will check whether a string contains HTML tag or not
|--------------------------------------------------------------------------
*/

class HTMLSpecialCharsRule implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */

    private $allow_html_tag;
    private $html_tag_regex = '/<[^<]+>/'; // Match any HTML tag
    private $script_tag_regex = '/<script.*>.*<\/script>/'; // Match script tag only

    public function __construct($allow_html_tag = false)
    {
        $this->allow_html_tag = $allow_html_tag;
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
        // If HTML tag is allowed
        if( $this->allow_html_tag ){
            $value = html_entity_decode($value);
            preg_match_all($this->script_tag_regex, $value, $script_tags);
            // Fails if there are script tags
            if($script_tags[0]){
                return false;
            }
        }
        // If HTML tag is not allowed
        else{
            preg_match_all($this->html_tag_regex, $value, $html_tags);
            // Fails if there are HTML tags
            if($html_tags[0]){
                return false;
            }            
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
        return 'Bad string inserted. Please try again.';
    }
}
