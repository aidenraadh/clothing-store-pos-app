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

import DashboardView from './components/views/DashboardView.js';
import ItemsStorageView from './components/views/items-storage/ItemsStorageView.js';
import StoresView from './components/views/stores/StoresView.js';
import UsersView from './components/views/UsersView.js';
import TransactionsView from './components/views/transactions/TransactionsView.js';
import ProfileView from './components/views/admin/ProfileView.js';
import ItemsTransferLogView from './components/views/ItemsTransferLogView.js';

import Navigations from './components/Navigations.js';
import {LoadingScreen} from './components/Windows.js';
import {SVGIcons, UserThumbnail} from './components/UtilityComponents.js';
import {
	parseIfJson, parseIfInt, xhttpPost, formatData, serializeObj, formatTime
} from './components/Utilities.js';

class App extends React.Component{
    constructor(props){
        super(props);
		const date = new Date();
		this.timezone_offset = date.getTimezoneOffset();
		this.default_date = formatTime(date);
		
        this.state = {
            current_view: 0,
            sidebar_shown: false,

			// Used in: DashboardView
			statistics: undefined,				
			// Used in: ItemsStorageView
			items: undefined,
			// Used in: ItemsTransferLogView
			items_transfer_log: undefined,
			// Used in: IndexStoresItemsView
			store: undefined,
			// Used in: UsersView
			admins: undefined,
			// Used in: UsersView
			employees: undefined,
			// Used in: ProfileView
			user: this.props.user,
			// Used in: TransactionsView
			transactions: undefined,
			// Used in: UsersView
			users: undefined,

			refreshedStates: [],
			dark_lds: false,
			transparent_lds: false,
        };

        this.generateView = this.generateView.bind(this);
        this.changeView = this.changeView.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);

		this.refreshAppState = this.refreshAppState.bind(this);

		this.refreshStatistics = this.refreshStatistics.bind(this);
		this.refreshItems = this.refreshItems.bind(this);
		this.refreshItemsTransferLog = this.refreshItemsTransferLog.bind(this);
		this.formatStoreItems = this.formatStoreItems.bind(this);
		this.refreshStore = this.refreshStore.bind(this);
		this.refreshUsers = this.refreshUsers.bind(this);
		this.refreshTransactions = this.refreshTransactions.bind(this);
    }

	generateView(id){
		switch(id){
            case 0: return (
                <DashboardView root={this} />
            ); break;
            case 1: return (
                <ItemsStorageView
					root={this}
					items={this.state.items}
				/>
            ); break;
            case 2: return (
                <StoresView
					root={this}
					store={this.state.store}
				/>
            ); break;
            case 3: return (
                <UsersView
					root={this}
					users={this.state.users}
				/>
            ); break;
            case 4: return (
                <TransactionsView
					root={this}
					transactions={this.state.transactions}
				/>
            ); break;			
			case 5: return (
				<ProfileView
					root={this}
				/>				
			); break;
			case 6: return (
				<ItemsTransferLogView
					root={this}
					items_transfer_log={this.state.items_transfer_log}
				/>				
			); break;				
			default: return 'View not found';
		}
	}    

	changeView(view_id){
		this.setState({current_view: view_id,sidebar_shown: false});
	}    	      

    toggleSidebar(){
        this.setState((state) => ({sidebar_shown: !state.sidebar_shown}));
    }

    scrollToTop(){
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera        
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

	formatItemsForStoring(items_maps){
		let frmtd_items = [];
        
		items_maps.forEach((item, item_key) => {
			let production_prices = {};
			let selling_prices = {};
			this.props.accepted_item_sizes.forEach((size) => {
				if(item.production_prices[size]){
                    production_prices[size] = item.production_prices[size];
                }
				if(item.selling_prices[size]){
                    selling_prices[size] = item.selling_prices[size];
                }
			});
			frmtd_items.push(
                {
					name: item.name, production_prices: production_prices,
					selling_prices: selling_prices
				}
            );
		});

        return frmtd_items;		
	}

	refreshStatistics(force){
		let filters = (
			this.state.statistics ? this.state.statistics.filters : {}
		);
		this.refreshAppState(
			'statistics', force, this.props.urls.dashboard,
			serializeObj(filters),
			function(response){
				const parsed = JSON.parse(response);
				return {
					transactions: parsed['transactions'],
					total_production_prices: parsed['total_production_prices'],
					filters: parsed['filters'],						
				};
			}
		);
	}

	refreshItems(force){
		let filters = (this.state.items ? this.state.items.filters : {});
		filters.rows_offset = 0;

		this.refreshAppState(
			'items', force, this.props.urls.index_items_storage,
			serializeObj(filters),
			function(response){
				const parsed = JSON.parse(response);
				let items = {
					rows: formatData(parsed.rows, 'id'),
					filters: parsed.filters,
				};
				items.accordions = (() => {
					let accordions = new Map();
					items.rows.forEach((item, id) => {
						accordions.set(id, false);
					});
				})();
				// Convert filters' numeric values to numeric
				for(let key in items.filters){
					const number = Number(items.filters[key]);
					if(number !== NaN || number === 0)
						items.filters[key] = number;
				}
				return items;
			}
		);
	}

	refreshItemsTransferLog(force){
		let filters = (
			this.state.items_transfer_log ?
			this.state.items_transfer_log.filters : {}
		);
		filters.rows_offset = 0;

		this.refreshAppState(
			'items_transfer_log', force, this.props.urls.index_items_transfer_log,
			serializeObj(filters),
			function(response){
				const parsed = JSON.parse(response);
				let items_transfer_log = {
					rows: parsed.rows,
					filters: parsed.filters,
					all_stores: parsed.all_stores
				};
				// Convert filters' numeric values to numeric
				for(let key in items_transfer_log.filters){
					const number = parseInt(items_transfer_log.filters[key]);
					if(!isNaN(number) || number === 0){
						items_transfer_log.filters[key] = number;
					}
				}
				return items_transfer_log;
			}
		);
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
				const parsed = JSON.parse(response);
				let store = {
					info: parsed.info,
					items: this.formatStoreItems(
						parsed.items
					),
					filters: parsed.filters,
					statistics: parsed.statistics,
					all_stores: formatData(parsed.all_stores, 'id'),
				};
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

	refreshUsers(force){
        if(!this.state.refreshedStates.includes('users')){
			this.setState((state) => {
				let refreshedStates = [...state.refreshedStates];
				refreshedStates.push('users');

				return {
					refreshedStates: [...refreshedStates],
					transparent_lds: force
				};
			});
			xhttpPost('', this.props.urls.index_users,
				{'X-CSRF-TOKEN': this.props.csrf_token},
				function(response, status_code, App){
					App.setState((state) => {
						const parsed = JSON.parse(response);

						let refreshedStates = [...state.refreshedStates];
						refreshedStates.splice(
							refreshedStates.indexOf('users'), 1
						);
						return {
							users: {
								admins: formatData(parsed.admins, 'id'),
								employees: formatData(parsed.employees, 'id'),
								active_stores: formatData(parsed.active_stores, 'id'),
							},
							refreshedStates: [...refreshedStates]
						}
					});						
				},
				function(response, status_code, App){
					App.setState((state) => {
						let refreshedStates = [...state.refreshedStates];
						refreshedStates.splice(
							refreshedStates.indexOf('users'), 1
						);
						return {refreshedStates: [...refreshedStates]}
					});					
					App.xhrFailCallback(response, status_code, App);
				}, this                
			);			
        }
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
				transactions.stores = formatData(transactions.stores, 'id');
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
	
	componentDidMount(){
		document.getElementById('view-data').remove();
	}

    render(){
        return (<>
			<Navigations
				sidebar_shown={this.state.sidebar_shown}
				toggleSidebar={this.toggleSidebar}
                main_navs_items={[
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 0 ? ' active' : '')}
                    onClick={() => this.changeView(0)}>
						<SVGIcons name={'layers'} color={''} />
						<span className="text">Dashboard</span>
					</button>,

					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 1 ? ' active' : '')}
                    onClick={() => this.changeView(1)}>
						<SVGIcons name={'hanger'} color={''} />
						<span className="text">Storage</span>
					</button>,
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 2 ? ' active' : '')}
                    onClick={() => this.changeView(2)}>
						<SVGIcons name={'home_2'} color={''} />
						<span className="text">Stores</span>
					</button>,
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 3 ? ' active' : '')}
                    onClick={() => this.changeView(3)}>
						<SVGIcons name={'group'} color={''} />
						<span className="text">Users</span>
					</button>,
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 4 ? ' active' : '')}
                    onClick={() => this.changeView(4)}>
						<SVGIcons name={'cart'} color={''} />
						<span className="text">Transactions</span>
					</button>,																                    
                ]}
				sidebar_items={[
					<button type="button" className={'sidebar-item'+
                    (this.state.current_view === 6 ? ' active' : '')}
                    onClick={() => this.changeView(6)}>
						<SVGIcons name={'share'} color={''} />
						<span className="text">Riwayat Transfer</span>
					</button>,
				]}				
				right_widgets={[
					<UserThumbnail
						tagname={'button'} 
						user_name={this.state.user.name}
						img_url={this.props.urls.images+'/testimonial-avatar-04.jpg'}
						container_classes={'topbar-item'}
						container_attr={{ type: 'button',
							onClick: (() => this.changeView(5)),
						}}
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