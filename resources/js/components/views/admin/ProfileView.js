import React from 'react';
import {Modal} from './../../Windows.js';
import {Buttons} from './../../Buttons.js';
import {SimpleCard} from './../../Cards.js';
import {TextInput} from './../../Forms.js';
import {LaravelCSRF} from './../../UtilityComponents.js';
import {formatTime, xhttpPost} from './../../Utilities.js';

export default class ProfileView extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			update_profile_modal: false,

            name: this.props.root.props.user.name,
			old_password_check: '',
			password: '',
			password_confirmation: '',
		};

		this.handleChange = this.handleChange.bind(this);
		this.updateProfile = this.updateProfile.bind(this);
		this.toggleModal = this.toggleModal.bind(this);
	}

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (is_int ? parseInt(form.value) : form.value);

		this.setState({[form_name]: value});
	}	

	updateProfile(){
        const root = this.props.root;
		const data = 'name='+this.state.name+
		'&old_password_check='+this.state.old_password_check+
		'&password='+this.state.password+
		'&password_confirmation='+this.state.password_confirmation;

		root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.update_users,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, statusCode, ProfileView){
                const parsed = JSON.parse(response);

				root.setState((state) => {
					let user = Object.create(state.user);
					user.name = parsed['name'];
					return {user: user, dark_lds: false};
				});
				ProfileView.setState({update_profile_modal: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
				root.setState({dark_lds: false});
            },
            this
        );
	}

	toggleModal(modal){
		this.setState((state) => ({
			[modal]: !state[modal]
		}));
	}

	componentDidMount(){
        this.props.root.scrollToTop();
	}

	render(){
		const root = this.props.root;
		const user = root.props.user;

		return (<>
			<SimpleCard
				cardTag={'article'} headingTag={'h1'}
				heading={'Your Profile'}
				action={
					<Buttons tag={'button'} settings={{ size: 'sm', type: 'primary', color: 'red' }}
						icon={{ name: 'sign_out', iconOnly: false }} text={'Logout'}
						attr={{ type: 'submit', form: 'logout-form' }}
					/>
				}
				body={
					<div id="user-profile">
						<p className="flex-row content-start">
							<img
								className="img profile-picture"
								src={root.props.urls.images+'/user_default_thumbnail.jpg'}
							/>
							<span className="info flex-col">
								<span className="user-name block text-medium text-dark-75">
									{user.name}
								</span>
								<span className="user-title block text-medium text-dark-65">
									Admin
								</span>
								<span className="user-details flex-col items-start">
									<span className="flex-row content-space-between">
										<span className="text-medium text-dark-75">Email:</span>
										<span>{user.email}</span>
									</span>
									<span className="flex-row content-space-between">
										<span className="text-medium text-dark-75">Joined At:</span>
										<span>{formatTime(user.created_at)}</span>
									</span>																		
								</span>
							</span>
						</p>			
						<Buttons tag={'button'}
							settings={{ size: 'md', type: 'light', color: 'blue' }}
							icon={{ name: 'write', iconOnly: true }}
							text={'Update profile'}
							attr={{ type: 'button',
								style: {position: 'absolute', top: '0', right: '0',},
								onClick: () => {this.toggleModal('update_profile_modal')}
							}}
						/>
					</div>						
				}
			/>
			<Modal toggleModal = {() => {this.toggleModal('update_profile_modal')}}
				modalShown={this.state.update_profile_modal}
				heading = {'Update Profile'}
				body = {<>
					<section className="form-section">
						<h6 className="heading text-dark-2 text-medium">Basic Info</h6>
						<TextInput form_name={'name'} label={'Nama'}
							type={'outline'} size={'md-input'}
							form_attr={{
								type:'text', value: this.state.name,
								onChange: (e) => {this.handleChange(e)},
							}}
						/>											
					</section>
					<section className="form-section">
						<h6 className="heading text-dark-2 text-medium">Ubah Password</h6>
						<TextInput form_name={'old_password_check'} type={'outline'}
							label={'Password Lama'} size={'md-input'}
							form_attr={{
								type:'password', value: this.state.old_password_check,
								onChange: (e) => {this.handleChange(e)},
							}}
						/>						
						<div className="flex-row content-space-between">
							<TextInput form_name={'password'} label={'Password Baru'}
								type={'outline'} size={'md-input'}
								form_attr={{
									type:'password', value: this.state.password,
									onChange: (e) => {this.handleChange(e)},
								}}
							/>
							<TextInput form_name={'password_confirmation'} type={'outline'}
								label={'Konfirmasi Password Baru'} size={'md-input'}
								form_attr={{
									type:'password', value: this.state.password_confirmation,
									onChange: (e) => {this.handleChange(e)},
								}}
							/>	
						</div>
					</section>										
				</>}
				footer={
					<Buttons settings={{ size: 'md', type: 'primary', color: 'blue' }}
						tag={'button'} text={'Save changes'}
						attr={{ type: 'button', onClick: this.updateProfile}}
					/>
				}
				footer_align={'center'}
				attr={{id: 'update-profile-modal'}}
			/>			
			<form id="logout-form" method="POST" action={root.props.urls.logout}>
				<LaravelCSRF csrf_token={root.props.csrf_token} />
			</form>
		</>);
	}
}
