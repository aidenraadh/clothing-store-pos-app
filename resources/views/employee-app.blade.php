@extends('layouts.app')

@section('title', 'Employee')

@section('appScripts')
<script type="text/javascript" src="{{asset('js/employee-app.js')}}?v={{config('app.asset_version')}}" defer></script>
@endsection

@section('content')

<div id="app"></div>

<script type="application/json" id="view-data">
    @json($view_data, JSON_PRETTY_PRINT)
</script>
@endsection