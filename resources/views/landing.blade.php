<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0">
	<meta name="description" content="HNSports POS App is a point of sale app for HNSports' clothing store management. This app developed by aidenraadh.com">
    <title>HNSports</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="{{asset('css/app.css')}}?v={{config('app.asset_version')}}">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
</head>

<body id="landing-page-body">

<article id="login-page" class="flex-col content-center items-center">
	<h1 class="text-bold" style="font-size: 3rem; margin-bottom: 1.6rem">HNSports POS App</h1>
    <button class="toggle-modal btn btn-lg btn-primary blue" type="button"
    data-modal-target="#admin-login-modal" style="width: 18rem; margin-bottom: 2rem;">
	    <span class="btn-text">Login as Admin</span>
    </button>
	<button class="toggle-modal btn btn-lg btn-primary blue" type="button"
    data-modal-target="#employee-login-modal" style="width: 18rem;">
	    <span class="btn-text">Login as Employee</span>
    </button>
</article>

<section id="admin-login-modal" class="modal content-sized-modal login-forms">
	<div class="overlay">
		<div class="modal-content">
			<div class="modal-header">
				<h6 class="heading text-dark-75 text-medium">Login as Admin</h6>
				<button class="toggle-modal text-blue" type="button"
                data-modal-target="#admin-login-modal">
                    &times;
                </button>
			</div>
			<div class="modal-body">
                <form id="admin-login-form" class="flex-col" method="POST"
				action="{{route('admin.login')}}">
                    @csrf
                    <span class="base-input lg-input outline">
						<label for="email">Email</label>
                    	<input type="email" name="email" required>
                    </span>
                    <span class="base-input lg-input outline">
						<label for="password">Password</label>
                    	<input type="password" name="password" required>
                    </span> 
                </form>                               
			</div>
			<div class="modal-footer align-center">
                <button class="btn btn-lg btn-primary blue" type="submit"
                form="admin-login-form" style="width: 12rem;">
	                <span class="btn-text">Login</span>
                </button>                 
			</div>
		</div>
	</div>
</section>

<section id="employee-login-modal" class="modal content-sized-modal login-forms">
	<div class="overlay">
		<div class="modal-content">
			<div class="modal-header">
				<h6 class="heading text-dark-75 text-medium">Login as Employee</h6>
				<button class="toggle-modal text-blue" type="button"
                data-modal-target="#employee-login-modal">
                    &times;
                </button>
			</div>
			<div class="modal-body">
                <form id="employee-login-form" class="flex-col" 
				method="POST" action="{{route('employee.login')}}">
                    @csrf
                    <span class="base-input lg-input outline text-capitalize">
						<label for="password">Toko</label>
                    	<select type="password" name="store_id" required>
						@foreach($stores as $store)
						<option value='{{$store->id}}'>{{$store->name}}</option>
						@endforeach
						</select>
                    </span> 					
                    <span class="base-input lg-input outline">
						<label for="email">Email</label>
                    	<input type="email" name="email" required>
                    </span>
                    <span class="base-input lg-input outline">
						<label for="password">Password</label>
                    	<input type="password" name="password" required>
                    </span>					
                </form>                               
			</div>
			<div class="modal-footer align-center">
                <button class="btn btn-lg btn-primary blue" type="submit"
                form="employee-login-form" style="width: 12rem;">
	                <span class="btn-text">Login</span>
                </button>                 
			</div>
		</div>
	</div>
</section>

<footer class="footer flex-row content-space-between items-center">
	<p>2020© HNSports. All rights reserved.</p>
	<p>
		Developed by: 
		<a target="_blank" href="https://www.aidenraadh.com/">aidenraadh.com</a>
	</p>
</footer>	


<script type="text/javascript" defer>

function toggleModal(modal_id){
    const modal = $(modal_id);
    
    if(modal.hasClass('shown')){
        modal.find('.modal-content').removeClass('shown')
        .one('transitionend', () => {
            modal.removeClass('shown');
        });          
    }
    else{
        modal.addClass('shown').one('transitionend', () => {
            modal.find('.modal-content').addClass('shown');
        });        
    }
}

$('.toggle-modal').click(function(){
    toggleModal( $(this).attr('data-modal-target') );
});

</script>

</body>

</html>
