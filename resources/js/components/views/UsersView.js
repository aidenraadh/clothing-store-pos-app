import React from 'react';

import {TabbedCard} from './../Cards.js';
import {Buttons} from './../Buttons.js';
import Table from './../Table.js';
import {Modal, confirmPopup} from './../Windows.js';
import {TextInput, Select} from './../Forms.js';
import {SVGIcons, UserThumbnail} from './../UtilityComponents.js';
import {xhttpPost, formatData, prettyTime, serializeObj} from './../Utilities.js';
import {SectionHeader} from './../Layouts.js';

export default class UsersView extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			user_type: null,
			create_user_modal: false,
			create_user_modal_heading: '',

			name: '', // The name of the to-be-created user
			email: '', // The email of the to-be-created user
			password: '', // The password of the to-be-created user
			password_confirmation: '', // The pass confirm of the to-be-created user
			store_id: '', // The store ID of the to-be-created employee
		};

		this.generateAdminsTable = this.generateAdminsTable.bind(this);
		this.generateEmployeesTable = this.generateEmployeesTable.bind(this);

		this.initCreateUser = this.initCreateUser.bind(this);
		this.createUser = this.createUser.bind(this);

		this.deleteUser = this.deleteUser.bind(this);

		this.toggleModal = this.toggleModal.bind(this)
	}

	generateAdminsTable(){
		const root = this.props.root;

		if(this.props.users === undefined)
			return root.viewStatusMsg('Loading...');
		if(this.props.users.admins.size === 0)
			return root.viewStatusMsg('Admin tidak ditemukan.');  		

		const users = this.props.users.admins;
		let TableHeadings = ['Name', 'Email', 'Joined At'];
		let TableBody = [];

		users.forEach((user, user_id) => {
			let TableRow = [];

			TableRow.push(
				<UserThumbnail
					img_url={root.props.urls.images+'/user_default_thumbnail.jpg'}
					user_name={user.name}
					tagname={'span'}
				/>,
				user.email,
				prettyTime(user.created_at, true),
			);
			TableBody.push(TableRow);
		});

		return (<>
		<div className="flex-row content-end">
			<Buttons tag={'button'} text={'+ Tambah'}
				settings={{ size: 'sm', type: 'light', color: 'blue' }}
				attr={{ type: 'button', style: {width: '12rem'}, onClick: () => {
						this.initCreateUser('admin')
					}
				}}
			/>
		</div>
		<Table
			headings={TableHeadings}
			body={TableBody}
		/>
		</>);		
	}

	generateEmployeesTable(){
		const root = this.props.root;
		const users_resource_url = root.props.urls.employees_resource;

		if(this.props.users === undefined)
			return root.viewStatusMsg('Loading...');
		if(this.props.users.active_stores.size === 0)
			return root.viewStatusMsg(
				'Toko belum ada, silahkan buat toko terlebih dahulu.'
			);		
		
		const users = this.props.users.employees;
		let CreateUserBtnJSX = (
			<div className="flex-row content-end">
				<Buttons tag={'button'} text={'+ Tambah'}
					settings={{ size: 'sm', type: 'light', color: 'blue' }}
					attr={{ type: 'button', style: {width: '12rem'}, onClick: () => {
							this.initCreateUser('employee')
						}
					}}
				/>
			</div>			
		);
		let UsersTableJSX = null;

		if(users.size === 0){
			UsersTableJSX = root.viewStatusMsg('Belum ada pegawai.');
		}
		else{
			UsersTableJSX =
			<Table
				headings={['Name', 'Email', 'Toko', 'Joined At', 'Actions']}
				body={(() => {
					let table_body = [];
					users.forEach((user, user_id) => {
						let table_row = [];
						table_row.push(
							<UserThumbnail
								img_url={root.props.urls.images+'/user_default_thumbnail.jpg'}
								user_name={user.name}
								tagname={'span'}
							/>,
							user.email,
							user.store_name,
							prettyTime(user.created_at, true),
							<Buttons tag={'button'} text={'Delete'}
								settings={{ size: 'sm', type: 'light', color: 'red' }}
								icon={{name: 'trash', iconOnly: true}}
								attr={{ type: 'button', onClick: () => {
										confirmPopup(
											'Hapus "'+user.name+'" dari pegawai?',
											function(UsersView){
												UsersView.deleteUser('employee', user_id);
											}, null, this
										)
									},							
								}}
							/>					
						);
						table_body.push(table_row);		
					});
					return table_body;
				})()}
			/>;
		}
		return <>
			{CreateUserBtnJSX}
			{UsersTableJSX}
		</>;
	}

	initCreateUser(user_type){
		const root = this.props.root;

		this.setState((state) => {
			let changed_states = {
				user_type: user_type,
				create_user_modal: true,
				store_id: '',
				name: '',
				email: '',
				password: '',
				password_confirmation: '',				
			};

			switch(user_type){
				case 'admin': 
					changed_states.create_user_modal_heading = 'Tambah Admin Baru';
					break;
				case 'employee':
					changed_states.create_user_modal_heading = 'Tambah Pegawai Baru';
					break;
				default: null;
			}			
			return changed_states;
		});
	}

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (is_int ? parseInt(form.value) : form.value);

		this.setState({[form_name]: value});
	}

	createUser(){
		const root = this.props.root;
		const user_type = this.state.user_type;

		const data='user_type='+user_type+'&name='+this.state.name+
		'&email='+this.state.email+'&password='+this.state.password+
		'&password_confirmation='+this.state.password_confirmation+
		(user_type === 'admin' ? '' : '&store_id='+this.state.store_id);

		root.setState({dark_lds: true});
		xhttpPost(data, root.props.urls.store_users,
			{'X-CSRF-TOKEN': root.props.csrf_token},
			function(response, status_code, UsersView){
				root.setState((state) => {
					const created_user = formatData(JSON.parse(response),'id');
					let users = {...state.users};
					users[user_type+'s'] = new Map([
						...created_user, ...users[user_type+'s']
					]);

					return {users: users,dark_lds: false};
				});
			},
			function(response, status_code, UsersView){
				root.xhrFailCallback(response, status_code, root.state.ripple_lds);
				root.setState({dark_lds: false});
			}
		);
	}

	deleteUser(user_type, user_id){
		const root = this.props.root;
		const data = {
			user_type: user_type,
			id: user_id
		};

		root.setState({dark_lds: true});
		xhttpPost(serializeObj(data), root.props.urls.delete_users,
			{'X-CSRF-TOKEN': root.props.csrf_token},
			function(response, status_code, UsersView){
				root.setState((state) => {
					let users = {...state.users};
					users[user_type+'s'].delete(user_id);

					return {users: users,dark_lds: false};
				});
			},
			function(response, status_code){
				root.xhrFailCallback(response, status_code);
				root.setState({dark_lds: false});
			}
		);
	}

	toggleModal(modal){
		this.setState((state) => ({
			[modal]: !state[modal],
		}));
	}

	refreshPage(force = false){
		const root = this.props.root;

        if(root.state.users === undefined || force){
            root.refreshUsers(force);
        }						
	}

    componentDidMount(){
        this.props.root.scrollToTop();
        this.refreshPage();
    }

	componentDidUpdate(prevProps){
		if(prevProps.users !== this.props.users){
			this.setState({create_user_modal: false});
		}
	}

	render(){
		const root = this.props.root;
		const users = this.props.users;

		return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'group'} color={'blue'}
					/>						
					Users
				</span>						
				}
				header_tag={'header'}
				heading_tag={'h1'}
                header_actions={
                    <Buttons tag={'button'} text={'Refresh'}
                        settings={{size: 'sm',type: 'primary',color: 'blue'}}
                        icon={{name: 'update', iconOnly: true}}
                        attr={{type: 'button', onClick: () => {this.refreshPage(true)}}}
                    />                      
                }				
				container_classes={'page-header'}
			/>		
			<TabbedCard
				tabs={[
					{
						link: 'Admin', panelID: 'admin',
						panelContent: this.generateAdminsTable()						
					},
					{
						link: 'Pegawai', panelID: 'employee',
						panelContent: this.generateEmployeesTable()
					}
				]}
				currentPanelID={'admin'}
				container_classes={'hotel-users-tabs'}
			/>
			<Modal toggleModal={() => {this.toggleModal('create_user_modal')}}
				modalShown={this.state.create_user_modal}
				heading={this.state.create_user_modal_heading}
				body={<>
					<div className="flex-row content-space-between">
						<TextInput form_name={'name'} label={'Nama (required)'}
							type={'outline'} size={'md-input'}
							container_classes={'block'}
							form_attr={{ type:'text', max: '30', required: true,
								value: this.state.name,
								onChange: (e) => {this.handleChange(e)}
							}}
						/>
						<TextInput form_name={'email'} label={'Email (required)'}
							type={'outline'} size={'md-input'}
							container_classes={'block'}
							form_attr={{ type:'email', required: true,
								value: this.state.email,
								onChange: (e) => {this.handleChange(e)}
							}}
						/>
					</div>
					{(this.state.user_type === 'admin' ? '' :

					<Select form_name={'store_id'} type={'outline'}
						size={'md-input'} label={'Toko (required)'}
						options={(() => {
							let options = [{value: '', text: 'Pilih toko'}];
							if(users && users.active_stores.size !== 0){
								users.active_stores.forEach((store, store_id) => {
									options.push(
										{value: store_id, text: store.name}
									);
								});
							}
							return options;
						})()}
						form_attr={{value: this.state.store_id,
							style: {textTransform: 'capitalize'},
							onChange: (e) => {this.handleChange(e, true)}
						}}
					/>
					
					)}	
					<TextInput form_name={'password'} label={'Password (required)'}
						type={'outline'} size={'md-input'}
						container_classes={'block'}
						form_attr={{ type:'password', required: true,
							value: this.state.password,
							onChange: (e) => {this.handleChange(e)}
						}}
					/>
					<TextInput form_name={'password_confirmation'}
						label={'Konfirmasi Password (required)'}
						container_classes={'block'}
						type={'outline'} size={'md-input'}
						form_attr={{ type:'password', required: true,
							value: this.state.password_confirmation,
							onChange: (e) => {this.handleChange(e)}
						}}
					/>
				</>}
				footer={
					<Buttons tag={'button'} text={'Tambahkan'}
						settings={{ size: 'md', type: 'primary', color: 'blue' }}
						attr={{ type: 'button', style: {width: '12rem'},
							onClick: this.createUser,
						}}
					/>
				}
				footer_align={'center'}
				attr={{id: 'create-user-modal'}}
			/>			
		</>);
	}
}