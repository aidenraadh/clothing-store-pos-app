/**
 * First we will load all of this project's JavaScript dependencies which
 * includes React and other helpers. It's a great starting point while
 * building robust, powerful web applications using React + Laravel.
 */

require('./bootstrap');

/**
 * Next, we will create a fresh React component instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

import React from 'react';
import ReactDOM from 'react-dom';

import Navigations from './components/Navigations.js';
import {LoadingScreen} from './components/Windows.js';
import {SVGIcons, UserThumbnail} from './components/UtilityComponents.js';
import {
	parseIfJson, xhttpPost, formatData,serializeObj,formatTime,
	parseIfInt
} from './components/Utilities.js';

import StoresView from './components/views/stores/StoresView.js';
import TransactionsView from './components/views/transactions/TransactionsView.js';
import ProfileView from './components/views/employee/ProfileView.js';

// Full screen mode on tablet and mobile
/* if(window.innerWidth <= 1100){
	const elem = document.documentElement;

	if(elem.requestFullscreen){
		elem.addEventListener('click', () => {
			elem.requestFullscreen();
		}, {once: true});
	}
	else if(elem.webkitRequestFullscreen){ // Safari
		elem.addEventListener('click', () => {
			elem.webkitRequestFullscreen();
		}, {once: true});		
	}
	else if(elem.msRequestFullscreen){ // IE11
		elem.addEventListener('click', () => {
			elem.msRequestFullscreen();
		}, {once: true});		
	}	
} */

class App extends React.Component{
    constructor(props){
        super(props);
		const date = new Date();
		this.timezone_offset = date.getTimezoneOffset();
		this.default_date = formatTime(date);
		
        this.state = {
            current_view: 0,
            sidebar_shown: false,

            user: this.props.user,
			store: undefined,
			transactions: undefined,

			refreshedStates: [],
			dark_lds: false,
			transparent_lds: false,
        };

        this.generateView = this.generateView.bind(this);
        this.changeView = this.changeView.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
		this.refreshTransactions = this.refreshTransactions.bind(this);

		this.refreshAppState = this.refreshAppState.bind(this);		
    }


	changeView(view_id){
		this.setState({current_view: view_id, sidebar_shown: false});
	}

	generateView(id){
		switch(id){
            case 0: return (
                <StoresView
					root={this}
					store={this.state.store}
				/>
            ); break;			
            case 1: return (
                <TransactionsView
					root={this}
					transactions={this.state.transactions}
				/>
            ); break;
			case 2: return (
				<ProfileView
					root={this}
				/>				
			); break;	            
			default: return 'View not found';
		}
	}

    toggleSidebar(){
        this.setState((state) => ({sidebar_shown: !state.sidebar_shown}));
    }

	xhrFailCallback(response, status_code){
		const parsedResponse = parseIfJson(response);

		if(status_code === 401){ // User is not authenticated
			window.location.replace(this.props.urls.app_url);
		}
		else if(status_code === 400){ // Input error
			let error_msg = 'Errors found!\n';
			parsedResponse.forEach((msg) => {
				error_msg += '- '+msg+'\n';
			});
			alert(error_msg);
		}
		else{ // Other error
			alert(response);			
		}
	}

	viewStatusMsg(message){
		return (
			<p className="flex-row content-center items-center text-medium text-dark-50"
			style={{fontSize: '1.6rem', height: '10rem', }}>
				<span>{message}</span>
			</p>		
		);
	}

	detectLastRows(length, offset, limit){
		if(length - offset === limit)
			return false;
		else
			return true;
	}

	refreshAppState(state_key, force, request_url, data = '', formatResponse = null){
        if(!this.state.refreshedStates.includes(state_key)){
			this.setState((state) => {
				let refreshedStates = [...state.refreshedStates];
				refreshedStates.push(state_key);

				return {
					refreshedStates: refreshedStates,
					transparent_lds: force
				};
			});			
            xhttpPost(data, request_url,
                {'X-CSRF-TOKEN': this.props.csrf_token},
                function(response, status_code, App){
					App.setState((state) => {
						let refreshedStates = [...state.refreshedStates];
						refreshedStates.splice(
							refreshedStates.indexOf(state_key), 1
						);
						return {
							[state_key]: (
								formatResponse ? formatResponse(response) : response
							),
							refreshedStates: refreshedStates,
							transparent_lds: false
						}
					});					
                },
                function(response, status_code, App){
					App.setState((state) => {
						let refreshedStates = [...state.refreshedStates];
						refreshedStates.splice(
							refreshedStates.indexOf(state_key), 1
						);
						return {
							transparent_lds: false,
							refreshedStates: refreshedStates
						}
					});
                    App.xhrFailCallback(response, status_code);
                }, this                
            );
        }
	}	

	formatStoreItems(items){
		let store_items = new Map();

		items.forEach((item) => {
			const item_id = item.item_id;
			const item_in_store = JSON.parse(item.store_items)[item_id];
			const item_name = item.item_name;
			const item_production_price = JSON.parse(item.item_production_price);
			const item_selling_price = JSON.parse(item.item_selling_price);
			let item_details = {};
			this.props.accepted_item_sizes.forEach((size) => {
				item_details[size] = {
					quantity: (
						item_in_store && item_in_store[size] ?
						item_in_store[size].quantity : 0
					),				
					production_price: (
						item_production_price && item_production_price[size] ?
						item_production_price[size] : 0
					),
					selling_price: (
						item_selling_price && item_selling_price[size] ?
						item_selling_price[size] : 0
					),					
					updated_at: (
						item_in_store && item_in_store[size] ?
						item_in_store[size].updated_at : null
					),										
				};
			});


			store_items.set(item_id, {
				name: item_name,
				details: item_details
			});
		});
		return store_items;
	}	

	refreshStore(force){
		let filters = (this.state.store ? this.state.store.filters : {});
		filters.rows_offset = 0;

		this.refreshAppState(
			'store', force, this.props.urls.index_stores,
			serializeObj(filters),
			(response) => {
				let store = JSON.parse(response);
				store.items = this.formatStoreItems(store.items);
				store.all_stores = formatData(store.all_stores, 'id');
				// Convert filters' numeric values to numeric
				for(let key in store.filters){
					const number = Number(store.filters[key]);
					if(number !== NaN || number === 0)
						store.filters[key] = number;
				}
				return store;
			}
		);
	}

	refreshTransactions(force){
		let filters = (this.state.transactions ? this.state.transactions.filters : {});
		filters.rows_offset = 0;

		this.refreshAppState(
			'transactions', force, this.props.urls.index_transactions,
			serializeObj(filters),
			function(response){
				let transactions = JSON.parse(response);
				transactions.rows = formatData(transactions.rows, 'id');
				transactions.incomplete_transactions = formatData(
					transactions.incomplete_transactions, 'id'
				);				

				// Convert filters' numeric values to numeric
				for(let key in transactions.filters){
					transactions.filters[key] = parseIfInt(transactions.filters[key]);
				}	
				return transactions;
			}
		);	
	}	

    scrollToTop(){
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera        
    }

    hideWindows(windows, component){
        component.setState(() => {
            let hidden_windows = {};
            windows.forEach((window) => {
                hidden_windows[window] = false;
            });
            return hidden_windows;
        });
    }	

	xhrFailCallback(response, status_code){
		const parsedResponse = parseIfJson(response);

		if(status_code === 401){ // User is not authenticated
			window.location.replace(this.props.urls.app_url);
		}
		else if(status_code === 400){ // Input error
			let error_msg = 'Errors found!\n';
			parsedResponse.forEach((msg) => {
				error_msg += '- '+msg+'\n';
			});
			alert(error_msg);
		}
		else{ // Other error
			alert(response);			
		}
	}

	viewStatusMsg(message){
		return (
			<p className="flex-row content-center items-center text-medium text-dark-50"
			style={{fontSize: '1.6rem', height: '10rem', }}>
				<span>{message}</span>
			</p>		
		);
	}
	
	componentDidMount(){
		document.getElementById('view-data').remove();
	}

    render(){
        return (<>
			<Navigations
				sidebar_shown={this.state.sidebar_shown}
				toggleSidebar={this.toggleSidebar}
				show_sidebar_btn={
					<button type="button" className="show-sidebar-btn"
					onClick={this.toggleSidebar}>
						<SVGIcons name={'blocks'} color={'blue'} />
					</button>
				}
                main_navs_items={[
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 0 ? ' active' : '')}
                    onClick={() => this.changeView(0)}>
						<SVGIcons name={'home_2'} color={''} />
						<span className="text">Toko</span>
					</button>,						
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 1 ? ' active' : '')}
                    onClick={() => this.changeView(1)}>
						<SVGIcons name={'cart'} color={''} />
						<span className="text">Transaksi</span>
					</button>,															                    
                ]}
				right_widgets={[
					<UserThumbnail
						tagname={'button'} container_attr={{ type: 'button',
							onClick: (() => this.changeView(2)),
						}}
						container_classes={'topbar-item'}
						img_url={this.props.urls.images+'/user_default_thumbnail.jpg'}
						user_name={this.state.user.name}
					/>                    
				]}				
			/>
            {this.generateView(this.state.current_view)}
            <LoadingScreen
                lds_shown={this.state.dark_lds}
                overlay={'dark'}
                loading_text={'Please wait...'}
                loader_color={'white'}
            />
            <LoadingScreen
                lds_shown={this.state.transparent_lds}
                overlay={'transparent'}
                loader_color={'blue'}
            /> 			
        </>);
    }
}

const view_data = JSON.parse(document.getElementById('view-data').innerHTML);

ReactDOM.render(
	<App
		user={view_data.user}
		urls={view_data.urls}
		csrf_token={view_data.csrf_token}
		accepted_item_sizes={view_data.accepted_item_sizes}
	/>,
	document.getElementById('app')
);