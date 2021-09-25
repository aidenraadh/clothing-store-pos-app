@extends('layouts.app')

@section('title', 'HNSports POS App | 419 - Page Expired')

@section('content')
<article class="error-page flex-col content-center items-center">
    <h1 class="flex-row items-center">
        <span class="text-semi-bold">419</span>
        <span>Page expired.</span>      
    </h1>
    <a class="btn btn-md btn-primary blue" href="{{config('app.url')}}">
        <span class="btn-text">Login again</span>
    </a>      
</article>
@endsection