import React from 'react';

import {Buttons} from './../../Buttons.js';
import {TextInput, SearchBox} from './../../Forms.js';
import {SectionHeader} from './../../Layouts.js';
import {ToolCard} from './../../Cards.js';
import Table from './../../Table.js';
import {SVGIcons,Label} from './../../UtilityComponents.js';
import {Modal} from './../../Windows.js';
import {xhttpPost, serializeObj, numToPrice, parseIfInt} from './../../Utilities.js';

export default class AddTransactionsView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
            items: new Map(),
            costumer_name: '',
            transaction_time: this.props.root.default_date,
            tool_cards: new Map(),
            /* Edit item details */
            item_key: null,
            item_name: '',
            item_details: {},
            edit_item_details_modal: false,
            /* Checkout transaction */
            payment_amount: '',
            checkout_transaction_modal: false,
		};
        this.toggleItem = this.toggleItem.bind(this);
        this.generateItems = this.generateItems.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.initEditItemDetails = this.initEditItemDetails.bind(this);
        this.handleItemDetails = this.handleItemDetails.bind(this);
        this.editItemDetails = this.editItemDetails.bind(this);
        this.checkoutTransaction = this.checkoutTransaction.bind(this);
        this.formatItems = this.formatItems.bind(this);
        this.storeTransaction = this.storeTransaction.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.toggleToolCard = this.toggleToolCard.bind(this);
	}

    // Add new item
    toggleItem(item_key = null){
		if(item_key === null){
            const accepted_item_sizes = this.props.root.props.accepted_item_sizes;

			this.setState((state) => {
				let items = new Map([...state.items]);
                let item_key = [...items.keys()].pop();
                item_key = (item_key ? item_key + 1 : 1);
				items.set(
					item_key, 
					{
                        id: '',
                        name: 'Item belum dipilih',
                        details: (() => {
                            let details = {};
                            accepted_item_sizes.forEach((size) => {
                                details[size] = {
                                    // Quantity of the size to be sold
                                    quantity: '',
                                    // Max quantity of the size to be sold
                                    max_quantity: '',                                    
                                    // Quantity of the size left on store
                                    quantity_left: '',
                                    // Wether or not this size is available
                                    is_available: false,
                                    selling_price: null,
                                    custom_price: '',
                                };
                            });
                            return details;
                        })(),
					}
				);

                let tool_cards = new Map([...state.tool_cards]);
                tool_cards.set(item_key, false);

				return {items: items, tool_cards: tool_cards};
			});
		}
		else{
			this.setState((state) => {
                let items = new Map([...state.items]);
                // Remove the item Map
                items.delete(item_key);

                let tool_cards = new Map([...state.tool_cards]);
                tool_cards.delete(item_key);

				return {items: items, tool_cards};
			});
		}
	}

    generateItems(){
        const root = this.props.root;
        let ItemCards_JSX = [];

        if(this.state.items.size === 0)
            return root.viewStatusMsg('Item belum ditambahkan.');
        
        this.state.items.forEach((item, item_key) => {
            const CardHeading = item.name;
            const CardBody = (<>
                <SearchBox
                    form_name={'item_name'} size={'md-input'}
                    addon={<SVGIcons  name={'search'} color={'blue'} />}
                    container_attr={{style: {marginBottom: '3rem'}}}
                    request_url={root.props.urls.search_items_storage}
                    request_headers={{'X-CSRF-TOKEN': root.props.csrf_token}}
                    container_classes={'items-search-box'}
                    label={
                        <span className="text-medium text-dark-65" style={{fontSize: '1.46rem'}}>
                            Pilih Item
                        </span>
                    }
                    form_attr={{
                        type:'text', autoComplete: 'off',
                        placeholder: 'Cari item'
                    }}
                    formatSearchResults={(response) => {
                        const items = JSON.parse(response);
                        if(items.length === 0){
                            return (
                                <ul>
                                    <li>
                                        <span className="search-result">
                                            Item tidak ditemukan
                                        </span>
                                    </li>
                                </ul>
                            );
                        }
                        let currenly_added_items_id = [];
                        this.state.items.forEach((item) => {
                            currenly_added_items_id.push(item.id);
                        });
                        const Items_JSX = items.map((item, list_key) => {
                            let search_result_btn_attr = {};
                            let search_result_btn_text = ''
                            // When the item is currently added
                            if(currenly_added_items_id.includes(item.id)){
                                search_result_btn_attr.disabled = true;
                                search_result_btn_text = item.name+' (Baru masuk)';
                            }
                            else{
                                search_result_btn_attr.onClick = () => {
                                    this.selectItem(item_key,item.id,item.name);
                                };
                                search_result_btn_text = item.name
                            }                                
                            return (
                            <li key={list_key}>
                                <button type="button" {...search_result_btn_attr}
                                className="search-result text-capitalize">
                                    {search_result_btn_text}
                                </button>
                            </li>
                            );
                        });                            
                        return (<ul>{Items_JSX}</ul>);
                    }}
                />
                {this.generateItemDetails(item, item_key)}                  
            </>);
            ItemCards_JSX.push(
                <ToolCard
                    key={item_key} tag={'article'} heading_tag={'h2'}
                    expanded={this.state.tool_cards.get(item_key)}
                    attr={{style: {marginBottom: '2rem'}}}
                    heading={CardHeading} body={CardBody}
                    classes={'transaction-item-card'}
                    toggle_button={
						<Buttons 
                            tag={'button'} classes={'toggle-btn'}
							settings={{size: 'sm',type: 'light',color: 'blue'}}
							text={'Toggle'} icon={{name: 'angle_up', iconOnly: true}}
							attr={{onClick: () => {this.toggleToolCard(item_key)}}}
						/>
                    }
                    right_side_actions={
						<Buttons tag={'button'} 
							settings={{size: 'sm',type: 'light',color: 'red'}}
							text={'Hapus item'} icon={{name: 'close', iconOnly: true}}
							attr={{onClick: () => {this.toggleItem(item_key)}}}
						/>                          
                    }
                />                
            );           
        });
        return (<>
            {ItemCards_JSX}
        </>);
    }

    generateItemDetails(item, item_key){
        const item_details = item.details
        const TableHeadings = [''];
        const TableQuantityRow = [<span className="text-medium text-dark-50">Jumlah</span>];
        const TablePriceRow = [<span className="text-medium text-dark-50">Harga Jual</span>];

        for(let size in item_details){
            let price = '';
            if(item_details[size].custom_price !== ''){
                price = 
                <span className="text-blue flex-row items-center content-center">
                    <SVGIcons
                        name={'sale_1'} color={'blue'}
                        attr={{style: {fontSize: '1.2em',marginRight: '0.4em',}}}
                    />
                    {'Rp. '+numToPrice(item_details[size].custom_price)}
                </span>;
            }
            else if(item_details[size].selling_price){
                price = <span>
                    {'Rp. '+numToPrice(item_details[size].selling_price)}
                </span>;
            }
            else{
                price = <span className="text-red">Belum ada</span>;
            }

            TableHeadings.push('Ukuran '+size.toUpperCase());
            TableQuantityRow.push(
                item_details[size].quantity ?
                item_details[size].quantity : 0
            );
            TablePriceRow.push(price);
        }
        return (
            <section>
                <div className="flex-row items-center" style={{marginBottom: '0.8rem'}}>
                    <h6 className="text-medium text-dark-65"
                    style={{marginRight: '1rem',fontSize: '1.46rem'}}>
                        Jumlah Item Dibeli
                    </h6>
                    <button className="action-btn flex-row items-center text-blue"
                    disabled={(item.id ? false : true)} type="button"
                    style={{fontSize: '1.46rem'}}
                    onClick={() => {this.initEditItemDetails(item_key)}}>
                        <SVGIcons
                            name={'write'} color={'blue'}
                            attr={{style: {marginRight: '0.8rem'}}}
                        />
                        <span className="block">Edit</span>
                    </button>                    
                </div>
                <aside className="text-blue flex-row items-center"
                style={{fontSize: '1.36rem',marginBottom: '0.4rem'}}>
                    <SVGIcons
                        name={'sale_1'} color={'blue'}
                        attr={{style: {fontSize: '1.2em',marginRight: '0.4em',}}}
                    />                
                    <span>Harga custom</span>
                </aside>
                <Table
                    headings={TableHeadings}
                    body={[TableQuantityRow, TablePriceRow]}
                    container_classes={'item-quantity-table'}
                />
            </section>              
        );
    }

    selectItem(item_key, item_id, item_name){
        const root = this.props.root;
        const transactions = this.props.transactions;

        const data = {
            store_id: transactions.filters.store_id,
            item_id: item_id
        };
        root.setState({dark_lds: true});
		xhttpPost(
            serializeObj(data),
            root.props.urls.get_store_item,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, AddTransactionsView){
                const parsed = JSON.parse(response);

                if(parsed.length === 0){
                    alert(
                        'Item: "'+item_name+'" tidak tersedia '+
                        'di toko.'
                    );
                }
                else{
                    AddTransactionsView.setState((state) => {
                        let items = new Map([...state.items]);
                        let target_item_map = items.get(item_key);

                        target_item_map.id = parseInt(item_id);
                        target_item_map.name = item_name;

                        const item_in_store = JSON.parse(
                            parsed[0].store_items
                        )[parseInt(item_id)];
                        const item_selling_price = JSON.parse(parsed[0].item_selling_price);

                        for(let size in target_item_map.details){
                            target_item_map.details[size].quantity_left = (
                                item_in_store[size] ? 
                                item_in_store[size].quantity : 0
                            );
                            target_item_map.details[size].is_available = (
                                item_in_store[size] && 
                                item_in_store[size].quantity !== 0 ? 
                                true : false
                            );
                            target_item_map.details[size].max_quantity = (
                                item_in_store[size] ? 
                                item_in_store[size].quantity : 0
                            );
                            target_item_map.details[size].selling_price = (
                                item_selling_price && item_selling_price[size] ? 
                                item_selling_price[size] : null
                            );                                                                                                               
                        }
                        items.set(item_key, target_item_map);

                        return {items: items};
                    });
                }
                root.setState({dark_lds: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: true});
            }, this
        );        
    }

    handleChange(e, is_int = false){
        const form = e.target;
        const form_name = form.name;
		const value = (is_int ? 
			(form.value ? parseInt(form.value) : form.value) : form.value
		);

        this.setState({[form_name]: value});
    }

    initEditItemDetails(item_key){
        this.setState((state) => {
            const item = state.items.get(item_key);
            return {
                item_key: item_key,
                item_name: item.name,
                item_details: (() => {
                    let item_details = {};
                    for(let size in item.details){
                        item_details[size] = {
                            quantity: item.details[size].quantity,
                            max_quantity: item.details[size].max_quantity,
                            quantity_left: item.details[size].quantity_left,
                            is_available: item.details[size].is_available,
                            selling_price: item.details[size].selling_price,
                            custom_price: item.details[size].custom_price                            
                        };
                    }
                    return item_details
                })(),
                edit_item_details_modal: true,
            };
        });
    }

    handleItemDetails(e){
        const form = e.target;
        const form_name = form.name
        const size = form_name.split('-')[1];
        const details_component = form_name.split('-')[0];
        const value = parseIfInt(form.value);

        this.setState((state) => {
            let item_details = {...state.item_details};
            switch(details_component){
                case 'quantity': 
                    item_details[size].quantity = value;
                    item_details[size].quantity_left = (
                        item_details[size].max_quantity - 
                        (value ? value : 0)
                    );
                    break;
                case 'price': 
                    item_details[size].custom_price = value;
                    break;
                default: null;
            }

            return {item_details: item_details};
        });
    }

    editItemDetails(){
        this.setState((state) => {
            let items = new Map([...state.items]);
            items.get(state.item_key).details = state.item_details;
            return {
                items: items,
                edit_item_details_modal: false,
            };
        })
    }

    checkoutTransaction(){
        if(Object.keys(this.formatItems()).length === 0)
            alert('Belum ada item ditambahkan');
        else
            this.setState({checkout_transaction_modal: true});
    }

    formatItems(){
        let frmtd_items = {};
        this.state.items.forEach((item) => {
            if(item.id){
                frmtd_items[item.id] = {};
                for(let size in item.details){
                    if(
                        item.details[size].quantity !== '' && 
                        item.details[size].quantity !== 0
                    ){
                        frmtd_items[item.id][size] = {
                            quantity: item.details[size].quantity,
                            custom_price: (
                                item.details[size].custom_price !== '' ? 
                                item.details[size].custom_price : null
                            ),                            
                        };
                    }
                }
            }
        });
        return frmtd_items;        
    }

    storeTransaction(){
        const root = this.props.root;
        const parent = this.props.parent;

        const data = {
            costumer_name: this.state.costumer_name,
            transaction_time: this.state.transaction_time+' 00:00:00',
            timezone_offset: root.timezone_offset,
            payment_details: JSON.stringify({
                date: this.state.transaction_time+' 00:00:00',
                amount: this.state.payment_amount,
            }),
            items: JSON.stringify(this.formatItems()),
        }
        root.setState(({dark_lds: true}));
		xhttpPost(
            serializeObj(data),
            root.props.urls.store_transactions,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                alert('Transaksi berhasil dibuat.')
                root.setState({transactions: undefined, dark_lds: false});
                parent.changeView(0);
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

    toggleToolCard(key){
        this.setState((state) => {
            let tool_cards = new Map([...state.tool_cards]);
            tool_cards.set(
                key, !tool_cards.get(key)
            );
            return {tool_cards: tool_cards};
        });
    }    

    componentDidMount(){
        this.props.root.scrollToTop();
    }

	render(){
        const parent = this.props.parent;

		return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
                    <button type="button" onClick={() => {parent.changeView(0)}}>
                        <SVGIcons name={'angle_left'} color={'blue'}
                            attr={{style: {width: '1.6em'}}}
                        />
                        <span className="sr-only">Back</span>
                    </button>					
					{'Buat Transaksi'}
				</span>						
				}
				header_tag={'header'}
				heading_tag={'h1'}
				container_classes={'page-header'}
			/>    
			{this.generateItems()}
            <button className="block text-medium text-blue" type="button"
            style={{margin: '0 auto'}} onClick={() => this.toggleItem()}>
                + Tambah item
            </button>            
			<div style={{width: '100%', height: '1px', margin: '2rem 0',
			backgroundColor: '#6993FF'}}></div>
			<Buttons tag={'button'}
				settings={{size: 'md',type: 'primary',color: 'blue'}}
				text={'Checkout'}
				classes={'block'}
				attr={{
					style: {margin: '0 auto', width: '14rem',},
					onClick: this.checkoutTransaction
				}}
			/>
            <Modal
                toggleModal = {() => {this.toggleModal('edit_item_details_modal')}}
                modalShown = {this.state.edit_item_details_modal}
                footer_align={'center'}
                heading={'Ubah Jumlah Item Dibeli'}
                body={(() => {
                    let Forms = [];
                    if(this.state.item_details){
                        for(let size in this.state.item_details){
                            Forms.push(
                                <div key={size} className="flex-row"
                                style={{paddingBottom: '1.6rem', marginBottom: '1.6rem',
                                borderBottom: '2px solid #EBEDF3'}}>
                                    <TextInput 
                                        size={'md-input'} type={'outline'}
                                        form_name={'quantity-'+size}
                                        label={
                                            <span>
                                                <span>{'Jumlah ('+size.toUpperCase()+')'}</span>
                                                <span className="inline-block text-blue"
                                                style={{marginLeft: '0.4rem'}}>
                                                    {'* '+this.state.item_details[size].quantity_left}
                                                </span>
                                            </span>                                            
                                        }
                                        container_attr={{style: {width: '100%',marginRight: '1.6rem'}}}
                                        form_attr={{ style: {width: '100%'}, min: 0,
                                            disabled: (
                                                this.state.item_details[size].is_available ? 
                                                false : true
                                            ),
                                            type: 'number', inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                            value: this.state.item_details[size].quantity,
                                            onChange: (e) => {this.handleItemDetails(e)},
                                        }}
                                    />
                                    <TextInput 
                                        size={'md-input'} type={'outline'}
                                        form_name={'price-'+size}
                                        label={'Harga Custom ('+size.toUpperCase()+')'}
                                        container_attr={{style: {width: '100%'}}}
                                        form_attr={{ style: {width: '100%'}, min: 0,
                                            disabled: (
                                                this.state.item_details[size].is_available ? 
                                                false : true
                                            ),                                        
                                            type: 'number', inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                            value: this.state.item_details[size].custom_price,
                                            onChange: (e) => {this.handleItemDetails(e)},
                                        }}
                                    />                                               
                                </div> 	                                
                            );
                        }
                    }
                    return (<>
					    <span className="flex-row items-center content-center text-blue 
					    text-capitalize"
					    style={{letterSpacing: '0.03em',borderBottom: '0.1rem solid #D9D9D9',
					    paddingBottom: '0.8em',fontSize: '1.56rem',marginBottom: '2rem'}}>
					    	<SVGIcons 
					    		name={'hanger'} color={'blue'}
					    		attr={{style: {width: '1.4em',marginRight: '0.3em'}}}
					    	/>
					    	{this.state.item_name}
					    </span> 
                        <aside className="text-dark-50"
                        style={{fontSize: '1.36rem',marginBottom: '2rem'}}>
                            * Kosongkan harga custom jika tidak menggunakan harga custom
                        </aside>
                        {Forms}              
                    </>);
                })()}
                footer={
			        <Buttons 
                        tag={'button'} text={'Simpan'}
			        	settings={{size: 'md',type: 'primary',color: 'blue'}}
			        	attr={{
                            style: {width: '14rem'},
                            type: 'button',onClick: this.editItemDetails
                        }}
			        />                    
                }
            />
            <Modal
                toggleModal = {() => {this.toggleModal('checkout_transaction_modal')}}
                modalShown = {this.state.checkout_transaction_modal}
                footer_align={'center'}
                heading={'Checkout Transaksi'}
                body={(() => {
                    if(Object.keys(this.formatItems()).length === 0)
                        return '';
                    let formatted_sold_items = [];
                    this.state.items.forEach((item) => {
                        formatted_sold_items.push({name: item.name, details: item.details});
                    });
                    const SoldItems_JSX = (
                        <section style={{marginBottom: '2rem'}}>
                            <h6 className="text-medium text-dark-65" 
                            style={{backgroundColor: '#F3F6F9',fontSize: '1.46rem',padding:'0.8em',
                            borderRadius: '0.55rem',width: '100%'}}>
                                Item Dibeli
                            </h6>                            
                            {parent.generateSoldItems(formatted_sold_items)}
                        </section>
                    );
                    const PaymentDetails_JSX = (
                        <section className="flex-row wrap content-space-between">
                            <h6 className="text-medium text-dark-65" 
                            style={{backgroundColor: '#F3F6F9',fontSize: '1.46rem',padding:'0.8em',
                            borderRadius: '0.55rem',marginBottom: '1.2rem',width: '100%'}}>
                                Pembayaran
                            </h6>
                            <aside className="text-dark-65" style={{fontSize: '1.36rem',
                            marginBottom: '1.2rem'}}>
                                NOTE: Jika jumlah yang dibayar pelanggan kurang dari jumlah 
                                yang harus dibayar, maka pembayaran akan dilakukan secara bertahap.
                            </aside>
                            <TextInput
                                label={'Nama Pelanggan'} form_name={'costumer_name'}
                                size={'md-input'} type={'outline'}
                                container_attr={{style: {width: '49%',}}}
                                form_attr={{style: {width: '100%'},
                                    type: 'text',
                                    value: this.state.costumer_name,
                                    onChange: (e) => {this.handleChange(e)},
                                }}
                            
                            />      
                            <TextInput
                                label={'Waktu transaksi'} form_name={'transaction_time'}
                                size={'md-input'} type={'outline'}
                                container_attr={{style: {width: '49%'}}}
                                form_attr={{style: {width: '100%',},type: 'date',
                                    value: this.state.transaction_time,
                                    onChange: (e) => {this.handleChange(e)},
                                }}
                            />
                            <TextInput
                                label={'Jumlah Dibayar'} form_name={'payment_amount'}
                                size={'md-input'} type={'outline'}
                                container_attr={{style: {width: '100%',marginTop: '0.6rem'}}}
                                form_attr={{style: {width: '100%'},
                                    type: 'number', inputMode: 'numeric',
                                    pattern: '[0-9]*',value: this.state.payment_amount,
                                    onChange: (e) => {this.handleChange(e,true)},
                                }}
                            />                                                                       
                        </section>
                    );
                    return (<>
                        {SoldItems_JSX}
                        {PaymentDetails_JSX}
                    </>);
                })()}
                footer={
			        <Buttons 
                        tag={'button'} text={'Buat transaksi'}
			        	settings={{size: 'md',type: 'primary',color: 'blue'}}
			        	attr={{
                            style: {width: '14rem'},
                            type: 'button',onClick: this.storeTransaction
                        }}
			        />                    
                }
            />                           		
        </>);
	}
}	