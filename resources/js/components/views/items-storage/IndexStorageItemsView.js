import React from 'react';

import {Buttons} from './../../Buttons.js';
import Table from './../../Table.js';
import {SectionHeader} from './../../Layouts.js';
import {PlainCard} from './../../Cards.js';
import {TextInput, TextInputAddon,Select,SearchBox} from './../../Forms.js';
import {Modal, confirmPopup} from './../../Windows.js';
import {Label, SVGIcons,} from './../../UtilityComponents.js';
import {
    xhttpPost, numToPrice, formatData, serializeObj, parseIfInt,prettyTime
} from './../../Utilities.js';

export default class IndexStorageItemsView extends React.Component{
	constructor(props){
		super(props);

		this.state = {
            selected_item: null,
            /* View item */
            viewed_item: null,
            view_item_modal: false,
            /*Update items state*/
            item_id: '',
            name: '',
            production_prices: (() => {
                let production_prices = {};
                this.props.root.props.accepted_item_sizes.forEach((size) => {
                    production_prices[size] = 0;
                });
                return production_prices
            })(),
            selling_prices: (() => {
                let selling_prices = {};
                this.props.root.props.accepted_item_sizes.forEach((size) => {
                    selling_prices[size] = 0;
                });
                return selling_prices
            })(),            
            update_item_modal: false,
            /*Filer items states*/
            filter_items_modal: false,
            rows_limit: 6,
			// If the last row of store items is loaded
			last_row_loaded: (this.props.items ?
                this.props.root.detectLastRows(
                    this.props.items.rows.size,
                    this.props.items.filters.rows_offset,
                    this.props.items.filters.rows_limit,
                ) : false
            ),
        };

        this.generateItemsTable = this.generateItemsTable.bind(this);
        this.generateItemsSearchBox = this.generateItemsSearchBox.bind(this);
        this.loadItems = this.loadItems.bind(this);
        this.getItem = this.getItem.bind(this);
        this.viewItem = this.viewItem.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handlePriceChange = this.handlePriceChange.bind(this);
        this.filterItems = this.filterItems.bind(this);
        this.initUpdateItem = this.initUpdateItem.bind(this);
        this.updateItem = this.updateItem.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.refreshPage = this.refreshPage.bind(this);
	}

    generateItemsTable(){
        const root = this.props.root;

		if(this.props.items === undefined)
			return this.props.root.viewStatusMsg('Loading...');

		if(this.props.items.rows.size === 0)
			return this.props.root.viewStatusMsg('Item kosong.'); 

        let items = (this.state.selected_item ?
            this.state.selected_item : this.props.items.rows
        );
        let Items_JSX = [];
        items.forEach((item, id) => {
            Items_JSX.push(
                <section key={id} className="flex-row content-space-between items-center item">
                    <h6 className="flex-row items-center">
                        <SVGIcons name={'hanger'} color={'blue'}/>
                        <span className="item-name text-truncate text-capitalize">{item.name}</span>
                    </h6>
                    <p className="flex-row items-center">
                        <Buttons tag={'button'} 
                            settings={{size: 'sm',type: 'light',color: 'purple'}}
                            text={'Detail'}
                            icon={{ name: 'visible', iconOnly: false }}
                            attr={{type: 'button', onClick: () => {this.viewItem(item)}}}
                        />            
                        <Buttons tag={'button'} 
                            settings={{size: 'sm',type: 'light',color: 'blue'}}
                            text={'Update'}
                            icon={{ name: 'write', iconOnly: false }}
                            attr={{type: 'button', onClick: () => {this.initUpdateItem(item, id)}}}
                        />
                        <Buttons tag={'button'} 
                            settings={{size: 'sm',type: 'light',color: 'red'}}
                            text={'Remove'}
                            icon={{ name: 'trash', iconOnly: false }}
                            attr={{type: 'button', onClick: () => {confirmPopup(
                                'Hapus item "'+item.name+'" dari database?',
                                () => {this.deleteItem(id)}
                            )}}}
                        /> 
                    </p>
                </section>
            );
        });

        return (<>
            <PlainCard
                content={<>
                    {this.generateItemsSearchBox()}                             
                    <div className="items-container">
                        {Items_JSX}
                    </div>
                    {(
                    this.state.last_row_loaded || this.state.selected_item !== null ? '' :
		            <button className="load-more-btn block text-blue flex-row 
		            items-center content-center" type="button"
		            onClick={this.loadItems}>
		            	<SVGIcons name={'arrow_to_bottom'} color={'blue'}/>
		            	Load more
		            </button>	
                    )}                   
                </>}
            />         
        </>);
    }

    generateItemsSearchBox(){
        const root = this.props.root;
        return (<>
            <SearchBox
                form_name={'item_name'} size={'md-input'}
                addon={<SVGIcons  name={'search'} color={'blue'} />}
                form_attr={{
                    type:'text', placeholder: 'Cari item',
                    autoComplete: 'off',
                }}
                request_url={root.props.urls.search_items_storage}
                request_headers={{'X-CSRF-TOKEN': root.props.csrf_token}}
                container_classes={'items-search-box'}
                container_attr={{style: {marginBottom: '0.8em'}}}
                formatSearchResults={(response) => {
                    const items = JSON.parse(response);
                    if(items.length === 0){
                        return (
                            <ul>
                                <li>
                                    <span className="search-result">
                                        Item tidak ditemukan.
                                    </span>
                                </li>
                            </ul>
                        )
                    }
                    const Items_JSX = items.map((item, list_key) => (
                        <li key={list_key}>
                            <button className="search-result text-capitalize"
                            onClick={() => {this.getItem(item.id)}}
                            type="button">
                                {item.name}
                            </button>
                        </li>                        
                    ));                           
                    return (<ul>{Items_JSX}</ul>);
                }}
            />     
            {( this.state.selected_item === null ? '' :
                <p className="flex-row content-space-between items-center
                search-results">
                    <span className="flex-row items-center">
                        <SVGIcons 
                            name={'search'} color={'blue'} 
                        />                         
                        <span className="text-medium" style={{marginLeft: '0.6rem'}}>
                        {this.state.selected_item.entries().next().value[1].name}
                        </span>
                    </span>
                    <button className="text-blue" type="button"
                    onClick={() => {this.setState({selected_item: null})}}>
                        &times; Clear
                    </button>                  
                </p>
            )}        
        </>);
    }

    loadItems(){
		const root = this.props.root;

		xhttpPost('', root.props.urls.load_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){

				root.setState((state) => {
					const loaded_items = formatData(
                        JSON.parse(response), 'id'
                    );
					let items = {...state.items};
					items.rows = new Map([
						...items.rows, ...loaded_items
					]);
					items.filters.rows_offset += items.filters.rows_limit;

					return {items: items,dark_lds: false};
				});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );           
    }

    getItem(item_id){
        const root = this.props.root;

        root.setState({dark_lds: true});
        xhttpPost(
            'id='+item_id, root.props.urls.get_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, IndexStorageItemsView){
                const selected_item = formatData(JSON.parse(response), 'id');
                IndexStorageItemsView.setState({selected_item: selected_item});
                root.setState({dark_lds: false});
            },
            function(response, status_code){
                root.setState({dark_lds: false});
                root.xhrFailCallback(response, status_code);
            }, this
        );
    }

    viewItem(item){
        this.setState({
            viewed_item: item,
            view_item_modal: true,
        });
    }

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (is_int ? parseIfInt(form.value) : form.value);
        this.setState({[form_name]: value});
	}

	handlePriceChange(e){
		const form = e.target;
		const form_name = form.name;		
		const price_type = form_name.split('-')[0]; 
		const item_size = form_name.split('-')[2];
		const price = parseIfInt(form.value);

		this.setState((state) => {
            let production_prices = {...state.production_prices};
            let selling_prices = {...state.selling_prices};

			switch(price_type){
				case 'production':
					production_prices[item_size] = price;
					break;
				case 'selling':
					selling_prices[item_size] = price;
					break;
				default: null;			
			}
			return {
                production_prices: production_prices,
                selling_prices: selling_prices
            };
		});
	}

    filterItems(){
        const root = this.props.root;
        const data = {
            rows_limit: this.state.rows_limit,
        };
        root.setState({dark_lds: true});
        xhttpPost(
            serializeObj(data), 
            root.props.urls.index_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState((state) => {
                    const parsed = JSON.parse(response);
                    let items = {
                        rows: formatData(parsed.rows, 'id'),
                        filters: parsed.filters,
                    };
                    // Convert filters' numeric values to numeric
                    for(let key in items.filters){
                        const number = Number(items.filters[key]);
                        if(number !== NaN || number === 0)
                        items.filters[key] = number;
                    }						
                    return {items: items,dark_lds: false};                    
                });
            },
            function(response, status_code){
                root.setState({dark_lds: false});
                root.xhrFailCallback(response, status_code);
            }
        );
    }

    initUpdateItem(item, item_id){
        this.setState((state, props) => {
            return {
                update_item_modal: true,
                item_id: item_id, name: item.name,
                production_prices: (() => {
                    let production_prices = {};
                    this.props.root.props.accepted_item_sizes.forEach((size) => {
                        production_prices[size] = (
                            item.production_prices &&
                            item.production_prices[size] ?
                            item.production_prices[size] : ''
                        );
                    });
                    return production_prices;                
                })(),
                selling_prices: (() => {
                    let selling_prices = {};
                    this.props.root.props.accepted_item_sizes.forEach((size) => {
                        selling_prices[size] = (
                            item.selling_prices &&
                            item.selling_prices[size] ?
                            item.selling_prices[size] : ''
                        );
                    });
                    return selling_prices;               
                })(),                
            };
        });
    }

    updateItem(){
        const root = this.props.root;
        // Create updated item map object
        const updated_item_map = new Map([[
            this.state.item_id,
            {
                name: this.state.name,
                production_prices: this.state.production_prices,
                selling_prices: this.state.selling_prices,
            }                
        ]]);
        const data = {
            id: this.state.item_id,
            item: JSON.stringify(
                root.formatItemsForStoring(updated_item_map)[0]
            )
        };      

        root.setState({dark_lds: true});
        xhttpPost(
            serializeObj(data), 
            root.props.urls.update_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                alert('Item berhasil di-update');
                root.setState({items: undefined,dark_lds: false});
            },
            function(response, status_code, ItemsDetailsView){
                root.setState({dark_lds: false});
                root.xhrFailCallback(response, status_code);
            }, this
        );
    }

    deleteItem(item_id){
        const root = this.props.root;

        root.setState({dark_lds: true});
        xhttpPost('id='+item_id, root.props.urls.delete_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                alert('Item berhasil dihapus');
                root.setState({items: undefined,dark_lds: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );
    }
    
    toggleModal(modal_name){
        this.setState((state) => (
            {[modal_name]: !state[modal_name]}
        ));
    }

    refreshPage(force = false){
        if(this.props.items === undefined || force){
            this.props.root.refreshItems(force);
        }
    }

    componentDidMount(){
        this.props.root.scrollToTop();
        this.refreshPage();
    }

    componentDidUpdate(prevProps){
        if(prevProps.items !== this.props.items){
            const current_items = this.props.items;
            const prev_items = prevProps.items;

            let changed_states = {
                filter_items_modal: false,
                update_item_modal: false,
                selected_item: null,
            };
            // If the store is undefined, refresh the store again
            if(current_items === undefined){
                this.setState(changed_states);
                this.refreshPage(true);
            }
            else{              
                changed_states.last_row_loaded = this.props.root.detectLastRows(
                    current_items.rows.size,
                    current_items.filters.rows_offset,
                    current_items.filters.rows_limit 
                );                
                this.setState(changed_states);
            }
        }
    }

	render(){
		const root = this.props.root;
        const parent = this.props.parent;

		return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'hanger'} color={'blue'}
						attr={{style: {width: '1.6em'}}}
					/>						
					Inventory
				</span>						
				}
                header_actions={
                    <Buttons tag={'button'} text={'Refresh'}
                        settings={{size: 'sm',type: 'primary',color: 'blue'}}
                        icon={{name: 'update', iconOnly: true}}
                        attr={{type: 'button', onClick: () => {this.refreshPage(true)}}}
                    />                      
                }
				header_tag={'header'}
				heading_tag={'h1'}
				container_classes={'page-header'}
			/>
            <button type="button" className="flex-row items-center floating-btn btn text-white" 
            style={{backgroundColor: '#4A7DFF',}} onClick={
                () => {parent.changeView(1)}
            }>
                +
                <SVGIcons
                    name={'hanger'}
                    color={'white'}
                    attr={{style: {width: '2em'}}}
                />                        
            </button>
            <div className="flex-row content-end">
                <Buttons
			    	tag={'button'} text={'Filter'} icon={{name: 'sort_1'}}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    attr={{type: 'button',
			    		style: {width: '10rem',marginBottom: '2rem'},
                        onClick: () => {this.toggleModal('filter_items_modal')},
                    }}
                />                  
            </div>
            {this.generateItemsTable()}      
            <Modal 
                heading = {'Update Item'}
                toggleModal={() => {this.toggleModal('update_item_modal')}}
                modalShown={this.state.update_item_modal} footer_align={'center'}
                body={<>
                <div style={{marginBottom: '1.2rem'}}>
				    <TextInput 
                        form_name={'name'} size={'sm-input'}
                        type={'outline'} label={'Nama Item'}
                        container_attr={{style: {width: '100%'}}}
				    	form_attr={{
				    		type: 'text',value: this.state.name,
                            style: {width: '100%'},
				    		onChange: (e) => {this.handleChange(e)},
				    	}}
				    /> 
                </div>
				<section>
					{root.props.accepted_item_sizes.map((size, idx) => (

                    <div key={idx} className="flex-row"
                    style={{paddingBottom: '1.6rem', marginBottom: '1.6rem',
                    borderBottom: '2px solid #EBEDF3'}}>
                        <TextInputAddon 
                            size={'md-input'} type={'outline'} addon={'Rp.'}
                            form_name={'production-price-'+size}
                            label={'Harga Produksi ('+size.toUpperCase()+')'}
                            form_attr={{ style: {width: '100%'}, min: 0,
                                type: 'number', inputMode: 'numeric', pattern: '[0-9]*',
                                value: this.state.production_prices[size],
                                onChange: (e) => {this.handlePriceChange(e)},
                            }}
                            container_attr={{style: {width: '100%'}}}
                        />
                        <TextInputAddon 
							form_name={'selling-price-'+size}
                            size={'md-input'} addon={'Rp'} type={'outline'}
                            label={'Harga Jual ('+size.toUpperCase()+')'}
                            form_attr={{style: {width: '100%'}, min: 0,
                                type: 'number', inputMode: 'numeric', pattern: '[0-9]*',
                                value: this.state.selling_prices[size],
                                onChange: (e) => {this.handlePriceChange(e)},
                            }}
                            container_attr={{style: {width: '100%', marginLeft: '2rem'}}}
                        />                                                  
                    </div> 	
					))}																	
				</section>               
                </>}
                footer={
                    <Buttons tag={'button'} text={'Simpan'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', onClick: this.updateItem,
                            style: {width: '14rem'}
                        }}
                    />                    
                }
            />
            <Modal 
                heading={'Filter Item'} footer_align={'center'}
                modalShown={this.state.filter_items_modal}
                toggleModal={() => {this.toggleModal('filter_items_modal')}}
                attr={{id: 'filter-items-modal'}}
                classes={'content-sized-modal'}
                body={<>
                    <Select
                        form_name={'rows_limit'} label={'Item ditampilkan'}
                        type={'outline'} size={'md-input'}                    
                        options={[{value: 6},{value: 12},{value: 20}]}
                        container_attr={{style: {width: '100%'}}}
                        form_attr={{
                            style: {width: '100%'},
                            value: this.state.rows_limit,
                            onChange: (e) => {this.handleChange(e, true)}
                        }}
                    />                          
                </>}
                footer={
                    <Buttons tag={'button'} text={'Filter'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', onClick: this.filterItems,
                            style: {width: '14rem'}
                        }}
                    />                    
                }
            />
            <Modal 
                heading={'Detail Item'}
                modalShown={this.state.view_item_modal}
                toggleModal={() => {this.toggleModal('view_item_modal')}}
                body={this.state.viewed_item === null ? '' : <>
					<span className="flex-row items-center content-center text-blue 
					text-capitalize"
					style={{letterSpacing: '0.03em',borderBottom: '0.1rem solid #D9D9D9',
					paddingBottom: '0.8em',fontSize: '1.56rem'}}>
						<SVGIcons 
							name={'hanger'} color={'blue'}
							attr={{style: {width: '1.4em',marginRight: '0.3em'}}}
						/>
						{this.state.viewed_item.name}
					</span>                 
                    <aside className="flex-row items-center text-dark-50"
                    style={{borderBottom: '0.1rem solid #D9D9D9',fontSize: '1.46rem',
                    padding: '0.8em 0'}}>
                        <SVGIcons
                            name={'clock'} color={'blue'}
                            attr={{style: {width: '1.3em',marginRight: '0.4em'}}}
                        />
                        <span className="inline-block" style={{marginRight: '0.2em'}}>
                            Dibuat pada:
                        </span>
                        {prettyTime(this.state.viewed_item.created_at, true)}
                    </aside>
                    <Table
                        headings={['Ukuran','Harga Produksi','Harga Jual']}
                        body={root.props.accepted_item_sizes.map((size) => (
                            [
                                size.toUpperCase(),
                                (
                                    this.state.viewed_item.production_prices &&
                                    this.state.viewed_item.production_prices[size] ?
                                    'Rp. '+numToPrice(
                                        this.state.viewed_item.production_prices[size]
                                    ) : 
                                    <span className="text-red">Belum ada</span>
                                ),
                                (
                                    this.state.viewed_item.selling_prices &&
                                    this.state.viewed_item.selling_prices[size] ?
                                    'Rp. '+numToPrice(
                                        this.state.viewed_item.selling_prices[size]
                                    ) :                                     
                                    <span className="text-red">Belum ada</span>
                                ),                                
                            ]
                        ))}
                    />                
                </>}
            />                                                         
        </>);
	}
}	