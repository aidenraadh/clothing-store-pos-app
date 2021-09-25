<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    private function getGuard($path){
        $path_prefix = explode('/', $path)[0];

        switch($path_prefix){
            case 'admin': return 'admin'; break;
            case 'employee': return 'employee'; break;
            default: return 'web';
        }        
    }    
    /**
     * Display the login view.
     *
     * @return \Illuminate\View\View
     */
    /*public function create()
    {
        return view('auth.login');
    }*/

    /**
     * Handle an incoming authentication request.
     *
     * @param  \App\Http\Requests\Auth\LoginRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');
        $guard = $this->getGuard($request->path());

        if($guard !== 'admin'){
            $credentials['deleted_at'] = null;
            $credentials['store_id'] = $request->store_id;
        }

        if (Auth::guard($guard)->attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended(route(
                config('auth.guards.'.$guard.'.home_route')
            ));
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    /**
     * Destroy an authenticated session.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Request $request)
    {
        $guard = $this->getGuard($request->path());

        Auth::guard($guard)->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
