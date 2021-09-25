import React from 'react';

import {Buttons,FloatingButton} from './../../Buttons.js';
import {SectionHeader} from './../../Layouts.js';
import {SimpleCard,StatsCard,PlainCard} from './../../Cards.js';
import {Select, TextInput} from './../../Forms.js';
import Table from './../../Table';
import {Modal,confirmPopup} from './../../Windows.js';
import {SVGIcons} from './../../UtilityComponents.js';
import {
	numToPrice, prettyTime, xhttpPost,
	formatData, serializeObj, parseIfInt
} from './../../Utilities';
import { root } from 'postcss';

export default class IndexTransactionsView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			transactions_complete: true,
			/* All transactions filters input */
			filter_transactions_modal: false,
			transactions_start_time: this.props.root.default_date,
			transactions_end_time: this.props.root.default_date,
			rows_limit: 6,
			store_id: '',
			// View Transaction
			view_items_details_modal: false,
			view_payment_details_modal: false,
			viewed_transaction: null,
			payment_amount: '',
			payment_date: this.props.root.default_date,
			// If the last row of transactions is loaded
			last_row_loaded: (this.props.transactions ? 
				this.props.root.detectLastRows(
					this.props.transactions.rows.size,
					this.props.transactions.filters.rows_offset,
					this.props.transactions.filters.rows_limit
				) : false
			),			
		};

		this.generateCompleteTransactions = this.generateCompleteTransactions.bind(this);
		this.generateIncompleteTransactions = this.generateIncompleteTransactions.bind(this);
		this.generateTransactionsStats = this.generateTransactionsStats.bind(this);
		this.generateTransactionsTable = this.generateTransactionsTable.bind(this);
		this.loadTransactions = this.loadTransactions.bind(this);
		this.filterTransactions = this.filterTransactions.bind(this);
		this.viewTransaction = this.viewTransaction.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.deleteTransaction = this.deleteTransaction.bind(this);
		this.addPayment = this.addPayment.bind(this);
		this.toggleModal = this.toggleModal.bind(this)
		this.refreshPage = this.refreshPage.bind(this);
	}

	generateCompleteTransactions(){
		const root = this.props.root;
		const transactions = this.props.transactions;

		if(transactions === undefined)
			return root.viewStatusMsg('Loading...');
		if(root.state.user.guard === 'admin' && transactions.stores.size === 0)
			return root.viewStatusMsg('Toko belum ada.');

		let CardHeading = (
			root.state.user.guard === 'employee' ?
			root.state.user.store.name : 
			transactions.stores.get(transactions.filters.store_id).name
		);
		let CardBody = '';
		let TransactionsTime = (
			<aside className="flex-row items-center text-dark-65 text-medium"
			style={{marginBottom: '2rem'}}>
				<span className="sr-only">Tanggal Transaksi: </span>
				<SVGIcons name={'calendar'} color={'blue'}
					attr={{style: {width: '2rem', marginRight: '0.8rem'}}}
				/>
				<span style={{fontSize: '1.46rem'}}>{
					prettyTime(
						transactions.filters.transactions_start_time,
						(transactions.filters.timezone_offset === 0 ? true : false)
					)+' - '+
					prettyTime(
						transactions.filters.transactions_end_time,
						(transactions.filters.timezone_offset === 0 ? true : false)
					)		
				}
				</span>	
			</aside>			
		);
		let TransactionsStats = '';
		let TransactionsTable = '';
		let LoadMoreBtn = '';

		if(transactions.rows.size === 0){
			CardBody = (<>
				{TransactionsTime}
				{root.viewStatusMsg('Transaksi belum ada.')}
			</>);
		}
		else{
			TransactionsStats = (root.state.user.guard === 'admin' ?
				this.generateTransactionsStats() : ''
			);
			TransactionsTable = this.generateTransactionsTable(transactions.rows);
			LoadMoreBtn = (
				this.state.last_row_loaded ? '' :
				<button className="load-more-btn block text-blue flex-row 
				items-center content-center" type="button"
				onClick={this.loadTransactions}>
					<SVGIcons
						name={'arrow_to_bottom'} color={'blue'}
					/>
					Load more
				</button>					
			);
			
			CardBody = (<>
				{TransactionsTime}
				{TransactionsStats}
				{TransactionsTable}
				{LoadMoreBtn}
			</>);
		}

		return (
			<SimpleCard
				heading={CardHeading} cardTag={'article'} 
				headingTag={'h2'} container_classes={'transactions-card'}
				body={CardBody}
			/>			
		);
	}

	generateIncompleteTransactions(){
		const root = this.props.root;
		const transactions = this.props.transactions;

		if(transactions === undefined)
			return root.viewStatusMsg('Loading...');
		if(root.state.user.guard === 'admin' && transactions.stores.size === 0)
			return root.viewStatusMsg('Toko belum ada.');
		if(transactions.incomplete_transactions.size === 0)
			return root.viewStatusMsg('Semua transaksi sudah telah selesai.');
		return(<>
			<PlainCard
				content={this.generateTransactionsTable(transactions.incomplete_transactions)}
				card_tag={'article'}
			/>			
		</>);
	}

	generateTransactionsStats(){
		return (
			<div className="flex-row sliding-stats-container">
				<StatsCard
					type={'light'} color={'blue'} icon={'sale_2'}
					card_tag={'p'} main_label={'Total profit'}
					number_label={'Rp. '+numToPrice(
						this.props.transactions.statistics.profit ?
						this.props.transactions.statistics.profit : 0
					)}
				/>				
				<StatsCard
					type={'light'} color={'blue'} icon={'sale_1'}
					card_tag={'p'} main_label={'Total pendapatan'}
					number_label={'Rp. '+numToPrice(
						this.props.transactions.statistics.total_income ?
						this.props.transactions.statistics.total_income : 0
					)}
				/>
				<StatsCard
					type={'light'} color={'blue'} icon={'hanger'}
					card_tag={'p'} main_label={'Item terjual'}
					number_label={(
						this.props.transactions.statistics.total_items_sold ?
						this.props.transactions.statistics.total_items_sold : 0
					)}
				/>					
			</div>			
		);
	}

	generateTransactionsTable(transactions){
		return (<>
			<aside className="text-blue flex-row items-center" 
			style={{fontSize: '1.36rem',marginBottom: '0.6rem'}}>
				<span className="text-blue flex-row items-center" style={{marginRight: '1rem'}}>
					<SVGIcons 
						name={'cart_outline'} color={'blue'}
						attr={{style: {width: '1.3em',marginRight: '0.2em'}}}
					/>				
					Transaksi selesai				
				</span>				
				<span className="text-blue flex-row items-center" >
					<SVGIcons 
						name={'sale_1'} color={'blue'}
						attr={{style: {width: '1.2em',marginRight: '0.2em'}}}
					/>				
					Terdapat harga custom					
				</span>
			</aside>
			<Table
				container_classes={'transactions-table'}
				container_attr={{style: {borderTop: '0.1rem solid #D9D9D9',fontSize: '1.46rem'}}}
				headings={['Nomor','Pelanggan','Toko','Total','Item Terjual','Waktu','Actions']}
				body={(() => {
					let TableRows = [];
					transactions.forEach((transaction, id) => {
						const is_custom_price = (
							transaction.cost_details.total !== 
							transaction.cost_details.total_original ?
							true : false
						);
						console.log(transaction.costumer_name,is_custom_price);
						const is_complete = (
							this.props.transactions.incomplete_transactions.has(id) ?
							false : true
						);						
						TableRows.push([
							<span className="flex-row items-center">
								<span className={'flex-col transaction-statuses'+
								(is_custom_price ? ' custom-price' : '')+
								(is_complete ? ' transaction-complete' : '')}>
									<SVGIcons name={'cart_outline'} />
									<SVGIcons name={'sale_1'}/>
								</span>
								<span className="text-right" style={{minWidth: '36%'}}>{id}</span>
							</span>,
							<span className="text-capitalize">{transaction.costumer_name}</span>,
							<span className="text-capitalize">{transaction.store_name}</span>,
							'Rp. '+numToPrice(transaction.cost_details.total),
							transaction.cost_details.total_items_sold,
							prettyTime(transaction.transaction_time, true),
							<>
							<Buttons
								tag={'button'} text={'View items details'}
								settings={{size: 'sm',type: 'light',color: 'blue'}}
								icon={{name: 'hanger', iconOnly: true}}
								attr={{type: 'button', onClick: () => {
										this.viewTransaction(id,'items-details')
									}
								}}
							/>
							<Buttons
								tag={'button'} text={'View payment details'}
								settings={{size: 'sm',type: 'light',color: 'purple'}}
								icon={{name: 'clipboard_list', iconOnly: true}}
								attr={{type: 'button',style: {marginLeft: '1rem'},
									onClick: () => {
										this.viewTransaction(id,'payment-details')
									}
								}}
							/>							
							{this.props.root.state.user.guard !== 'admin' ? '' :
							<Buttons
								tag={'button'} text={'Delete transaction'}
								settings={{size: 'sm',type: 'light',color: 'red'}}
								icon={{name: 'trash', iconOnly: true}}
								attr={{style: {marginLeft: '1rem'}, type: 'button',
									onClick: () => {
										confirmPopup('Hapus transaksi ini? Item yang '+
										'sudah terjual akan dikembalikan ke tempat asal.',
											() => {this.deleteTransaction(id)}
										)
									}
								}}
							/>								
							}				
							</>							
						]);
					});
					return TableRows;
				})()}
			/>			
		</>);
	} 	

	loadTransactions(){
		const root = this.props.root;

		xhttpPost('', root.props.urls.load_transactions,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, TransactionsView){

				root.setState((state) => {
					const loaded_transactions = formatData(
						JSON.parse(response), 'id'
					);						
					let transactions = {...state.transactions};
					transactions.rows = new Map([
						...transactions.rows, ...loaded_transactions
					]);
					transactions.filters.rows_offset += transactions.filters.rows_limit;

					return {
						transactions: transactions,
						dark_lds: false
					};
				});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }, this
        ); 
	}

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (is_int ? parseIfInt(form.value) : form.value);

		this.setState({[form_name]: value});
	}	

	filterTransactions(){
		const root = this.props.root;
		
		const data = serializeObj({
			// If the user is employee, use the ID of the store where the user
			// working
            store_id: (
				root.state.user.guard === 'employee' ? 
				root.state.user.store.id : this.state.store_id				
			),
			transactions_start_time: this.state.transactions_start_time+
				' 00:00:00',
			transactions_end_time: this.state.transactions_end_time+
				' 23:59:59',
			timezone_offset: root.timezone_offset,
			rows_limit: this.state.rows_limit
		});

		root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.index_transactions,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, TransactionsView){
				root.setState((state) => {
					let transactions = JSON.parse(response);
					transactions.rows = formatData(transactions.rows, 'id');
					transactions.incomplete_transactions = formatData(
						transactions.incomplete_transactions, 'id'
					);					
					if(transactions.stores !== undefined){
						transactions.stores = formatData(transactions.stores, 'id');
					}
					// Convert filters' numeric values to numeric
					for(let key in transactions.filters){
						transactions.filters[key] = parseIfInt(transactions.filters[key]);
					}					
					return {
						transactions: transactions,
						dark_lds: false,
					};					
				});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }, this
        );  		
	}

	viewTransaction(id, category){
		this.setState((state,props) => {
			let changed_states = {
				viewed_transaction: props.transactions.rows.get(id),
			};
			changed_states.viewed_transaction.id = id;
			switch(category){
				case 'items-details':
					changed_states.view_items_details_modal = true;
					break;
				case 'payment-details':
					changed_states.view_payment_details_modal = true;
					break;
				default: null;					
			}
			return changed_states;
		});
	}

	deleteTransaction(id){
		const root = this.props.root;

		root.setState({dark_lds: true});
        xhttpPost('id='+id, root.props.urls.delete_transactions,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, TransactionsView){
				root.setState({transactions: undefined,dark_lds: false,});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }, this
        ); 		
	}

	addPayment(){
		const root = this.props.root;
		const data = {
			id: this.state.viewed_transaction.id,
			payment_details: JSON.stringify({
				date: this.state.payment_date+' 00:00:00',
				amount: this.state.payment_amount,
			}),
			timezone_offset: root.timezone_offset
		};
		root.setState({dark_lds: true});
        xhttpPost(serializeObj(data), root.props.urls.update_transactions,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
				root.setState({transactions: undefined, dark_lds: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );  
	}

    toggleModal(modal){
        this.setState((state) => ({
            [modal]: !state[modal]
        }));
    }	

	refreshPage(force = false){
        if(this.props.transactions === undefined || force){
            this.props.root.refreshTransactions(force);
        }	
	}	

    componentDidMount(){
		this.props.root.scrollToTop();
		this.refreshPage();
    }

    componentDidUpdate(prevProps){
		// If the transactions is updated
        if(prevProps.transactions !== this.props.transactions){
			const current_transactions = this.props.transactions;
			let changed_states = {
				filter_transactions_modal: false,
				view_items_details_modal: false
			};
            // If the transactions is undefined, refresh the transactions again
            if(current_transactions === undefined){
                this.setState(changed_states);
                this.refreshPage(true);
            }
			else{
				changed_states.last_row_loaded = this.props.root.detectLastRows(
					current_transactions.rows.size,
					current_transactions.filters.rows_offset,
					current_transactions.filters.rows_limit
				);             
				this.setState(changed_states);
			}
        }
    }

	render(){
		const root = this.props.root;
		const parent = this.props.parent;
		const CreateTransactionBtn = (this.props.root.state.user.guard === 'employee' ?
			<FloatingButton
				tag={'button'} 
				text={<>
                    +
                    <SVGIcons
                        name={'cart'} color={'white'}
                        attr={{style: {width: '1.8em'}}}
                    /> 				
				</>}
				attr={{type: 'button', onClick: () => {parent.changeView(1)}}}
			/>	: ''			
		);
		const FilterTransactionsBtn = (this.state.transactions_complete ?
			<Buttons 
				tag={'button'} text={'Filter'}
				settings={{size: 'sm',type: 'primary',color: 'blue'}}
				icon={{name: 'sort_1'}}
				attr={{type: 'button',  style: {width: '9rem'},
					onClick: () => {
						this.toggleModal('filter_transactions_modal')
					},
				}}
			/>	: ''
		);
		return (<>
			<SectionHeader
				header_tag={'header'}
				heading_tag={'h1'}
				container_classes={'page-header'}		
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'cart'} color={'blue'}
						attr={{style: {width: '1.6em'}}}
					/>						
					Transaksi
					<button type="button"
					onClick={() => {this.setState({transactions_complete: true})}}
					className={
						'nav-btn '+
						'text-medium'+(this.state.transactions_complete ? 
						' active' : '')
					}>
						Semua
					</button>
					<button type="button"
					onClick={() => {this.setState({transactions_complete: false})}}
					className={
						'nav-btn '+
						'text-medium'+(this.state.transactions_complete === false ? 
						' active' : '')
					}>
						Belum selesai
					</button>
				</span>						
				}
                header_actions={
                    <Buttons tag={'button'} text={'Refresh'}
                        settings={{size: 'sm',type: 'primary',color: 'blue'}}
                        icon={{name: 'update', iconOnly: true}}
                        attr={{type: 'button', onClick: () => {this.refreshPage(true)}}}
                    />                      
                }
			/>
			<section className="flex-row content-end" style={{marginBottom: '2rem'}}>
				{CreateTransactionBtn}	
				{FilterTransactionsBtn}				
			</section>	
			{this.state.transactions_complete ? 
				this.generateCompleteTransactions() :
				this.generateIncompleteTransactions()
			}
			<Modal
				heading = {'Filter Transaksi'} footer_align={'center'}
				modalShown = {this.state.filter_transactions_modal}
				attr={{id: 'filter-transactions-modal'}}
				toggleModal = {() => {this.toggleModal('filter_transactions_modal')}}
				body={<>
					<div className="flex-row wrap content-space-between">
						{(this.props.root.state.user.guard === 'admin' ?
						<Select
							form_name={'store_id'} label={'Toko'}
							container_attr={{style: {width: '100%'}}}
							form_attr={{value: this.state.store_id,
								style: {width: '100%'},
								onChange: (e) => {this.handleChange(e, true)}
							}}
							options={(() => {
								let options = [{value: '', text: 'Pilih toko'}];
								if(this.props.transactions !== undefined){
									this.props.transactions.stores.forEach((store, id) => {
										options.push({value: id, text: store.name});
									});
								}
								return options;
							})()}
						/> : ''				
						)}
						<TextInput
							form_name={'transactions_start_time'} label={'Dari'}
							form_attr={{type:'date', 
								value: this.state.transactions_start_time,
								onChange: (e) => {this.handleChange(e)}
							}}
						/>
						<TextInput
							form_name={'transactions_end_time'} label={'Hingga'}
							form_attr={{type:'date',
								value: this.state.transactions_end_time,
								onChange: (e) => {this.handleChange(e)}
							}}
						/>							
					</div>
					<Select
						form_name={'rows_limit'} label={'Baris ditampilkan'}
						form_attr={{style: {width: '100%'},
							value: this.state.rows_limit,
							onChange: (e) => {this.handleChange(e, true)}
						}}
						options={[{value: 6}, {value: 12}, {value: 20}]}
					/>										
				</>}
			    footer={
					<Buttons 
						tag={'button'} text={'Filter'}
						settings={{size: 'md',type: 'primary',color: 'blue'}}
						attr={{style: {width: '12rem'}, type: 'button',
							onClick: this.filterTransactions
						}}
					/>						
				}
			/>
			<Modal
				heading = {'Detail Item Terjual'}
				toggleModal = {() => {this.toggleModal('view_items_details_modal')}}
				modalShown = {this.state.view_items_details_modal}				
				body={(() => {
					const viewed_transaction = this.state.viewed_transaction;
					if(viewed_transaction === null){
						return '';
					}
					let formatted_sold_items = []
					for(let item_id in viewed_transaction.items_details){
						formatted_sold_items.push(
							viewed_transaction.items_details[item_id]
						);

					}
					return (<>
					<span className="flex-row items-center text-medium text-blue 
					text-capitalize"
					style={{letterSpacing: '0.03em',borderBottom: '0.1rem solid #D9D9D9',
					paddingBottom: '0.8em',fontSize: '1.5	6rem'}}>
						<SVGIcons 
							name={'cart'} color={'blue'}
							attr={{style: {width: '1.4em',marginRight: '0.3em'}}}
						/>
						{'Nomor transaksi: '+viewed_transaction.id}
					</span>
					{parent.generateSoldItems(formatted_sold_items)}
					</>);					
				})()}
			/>
			<Modal
				heading = {'Detail Pembayaran'}
				toggleModal = {() => {this.toggleModal('view_payment_details_modal')}}
				modalShown = {this.state.view_payment_details_modal}				
				body={(() => {
					const viewed_transaction = this.state.viewed_transaction;
					if(viewed_transaction === null){
						return '';
					}
					let TableBody = [];
					let total_already_paid = 0;
					viewed_transaction.payment_details.forEach((payment_detail) => {
						total_already_paid += payment_detail.amount;
						TableBody.push([
							'Rp. '+numToPrice(payment_detail.amount),
							prettyTime(payment_detail.date, true)
						]);
					})
					const AddPayment_JSX = (
						viewed_transaction.cost_details.total !== total_already_paid &&
						root.state.user.guard === 'employee' ? 
                        <section className="flex-row wrap content-space-between">
                            <h6 className="text-medium text-dark-65" 
                            style={{backgroundColor: '#F3F6F9',fontSize: '1.46rem',padding:'0.8em',
                            borderRadius: '0.55rem',margin: '1.2rem 0',width: '100%'}}>
                                Tambah Pembayaran
                            </h6>
                            <aside className="text-dark-65" style={{fontSize: '1.36rem',
                            marginBottom: '1.2rem'}}>
                                NOTE: Jika jumlah yang dibayar pelanggan kurang dari jumlah 
                                yang harus dibayar, maka pembayaran akan dilakukan secara bertahap.
                            </aside>
                            <TextInput
                                label={'Jumlah Dibayar'} form_name={'payment_amount'}
                                size={'md-input'} type={'outline'}
                                container_attr={{style: {width: '48%',}}}
                                form_attr={{style: {width: '100%'},
                                    type: 'number', inputMode: 'numeric',
                                    pattern: '[0-9]*',value: this.state.payment_amount,
                                    onChange: (e) => {this.handleChange(e,true)},
                                }}
                            />
                            <TextInput
                                label={'Waktu pembayaran'} form_name={'payment_date'}
                                size={'md-input'} type={'outline'}
                                container_attr={{style: {width: '48%',}}}
                                form_attr={{style: {width: '100%'},
                                    type: 'date', value: this.state.payment_date,
                                    onChange: (e) => {this.handleChange(e)},
                                }}
                            
                            />
							<Buttons 
								tag={'button'} text={'Tambah pembayaran'}
								settings={{size: 'md',type: 'primary',color: 'blue'}}
								attr={{type: 'button',  style: {width: '100%',marginTop: '3.4%'},
									onClick: this.addPayment,
								}}
							/>				 							                                                            
                        </section> : ''					
					);
					return (<>
					<span className="flex-row items-center text-medium text-blue 
					text-capitalize"
					style={{letterSpacing: '0.03em',borderBottom: '0.1rem solid #D9D9D9',
					paddingBottom: '0.8em',fontSize: '1.56rem'}}>
						<SVGIcons 
							name={'cart'} color={'blue'}
							attr={{style: {width: '1.4em',marginRight: '0.3em'}}}
						/>
						{'Nomor transaksi: '+viewed_transaction.id}
					</span>
					<Table
						headings={['Jumlah','Waktu']}
						container_attr={{style: {fontSize: '1.46rem'}}}
						body={TableBody}
					/>
					<p className="flex-row content-space-between text-dark-65"
					style={{fontSize: '1.46rem',borderTop: '0.1rem solid #D9D9D9',
					paddingTop: '0.8em'}}>
						Total terbayar:
						<span>
							{'Rp. '+numToPrice(total_already_paid)+
							'/Rp. '+numToPrice(viewed_transaction.cost_details.total)}
						</span>
					</p>
					{AddPayment_JSX}			
					</>);
				})()}
			/>			
		</>);
	}
}	