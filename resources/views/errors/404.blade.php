@extends('layouts.app')

@section('title', 'HNSports POS App | 404 - Page Not Found')

@section('content')
<article class="error-page flex-col content-center items-center">
    <h1 class="flex-row items-center">
        <span class="text-semi-bold">404</span>
        <span>Page not found.</span>      
    </h1>
    <a class="btn btn-lg btn-primary blue" href="{{config('app.url')}}">
        <span class="btn-text">Go back</span>
    </a>      
</article>
@endsection