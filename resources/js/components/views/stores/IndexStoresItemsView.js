import React from 'react';

import {Buttons} from './../../Buttons.js';
import {Select, TextInput, Radio, SearchBox} from './../../Forms.js';
import Table from './../../Table.js';
import {Grid} from './../../Layouts';
import {SimpleCard, StatsCard,KanbanBoard} from './../../Cards.js';
import {SectionHeader} from './../../Layouts.js';
import {confirmPopup, promptPopup, Modal} from './../../Windows.js';
import {SVGIcons,Label} from './../../UtilityComponents.js';
import {numToPrice, xhttpPost, prettyTime, serializeObj, formatData, parseIfInt} from './../../Utilities.js';

export default class IndexStoresItemsView extends React.Component{
	constructor(props){
		super(props);

		this.state = {
            selected_item: null,
            /* Filter store items */
            filter_store_items_modal: false,
            store_id: '',
            rows_limit: 6,
            /* View store item */
            viewed_item: null,
            view_item_modal: false,
            updated_item_qt: {},
            /* Transfer items states */
            item_id: '',
            item_name: '',
            target_store_id: '',
            origin_store_id: '',
            quantities: (() => {
                let quantities = {};
                this.props.root.props.accepted_item_sizes.forEach((size) => {
                    quantities[size] = {
                        quantity: '',
                        quantity_left: 0,
                        max_quantity: 0,
                        is_available: false
                    };
                });
                return quantities;                
            })(),
            transfer_items_modal: false,            
            /* Add store */
            add_store_modal: false,
            name: '',
            active_store: 1,
            // Loading screen status
            dark_lds: false,
            transparent_lds: false,
            // Searched item JSX
            searched_item: null,
			// If the last row of store items is loaded
			last_row_loaded: (this.props.store ?
                this.props.root.detectLastRows(
                    this.props.store.items.size,
                    this.props.store.filters.rows_offset,
                    this.props.store.filters.rows_limit,
                ) : false
            ),
        };

        this.filterStoreItems = this.filterStoreItems.bind(this);
        this.generateStoreDetails = this.generateStoreDetails.bind(this);
        this.generateStoreItems = this.generateStoreItems.bind(this);
        this.loadStoreItems = this.loadStoreItems.bind(this);
        this.getStoreItem = this.getStoreItem.bind(this);
        this.viewStoreItem = this.viewStoreItem.bind(this);
        this.editItemQt = this.editItemQt.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.generateTransferItemModal = this.generateTransferItemModal.bind(this);
        this.getItemForTransfer = this.getItemForTransfer.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.tranferItems = this.tranferItems.bind(this);        
        this.createStore = this.createStore.bind(this);
        this.updateStore = this.updateStore.bind(this);
        this.initUpdateItem = this.initUpdateItem.bind(this);
        this.updateItem = this.updateItem.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.refreshPage = this.refreshPage.bind(this);
	}

    generateStoreDetails(){
        const root = this.props.root;

		if(this.props.store === undefined)
			return root.viewStatusMsg('Loading...');
		if(this.props.store.info === null)
			return root.viewStatusMsg('Toko belum ada.');          
        
        const store = this.props.store;
        let CardHeading_JSX = <span className="text-capitalize">{store.info.name}</span>;
        let CardActions_JSX = (root.state.user.guard === 'admin' ? <>
            <Buttons tag={'button'} text={'Update toko'}
                settings={{size: 'sm',type: 'light',color: 'blue'}}
                icon={{name: 'write', iconOnly: true}}
                attr={{type: 'button',
                    onClick: () => {
                        promptPopup('Ubah nama toko', store.info.name,
                            function(input, IndexStoresItemsView){
                                IndexStoresItemsView.updateStore(
                                    store.info.id, input
                                )
                            }, null, this
                        )
                    },                     
                }}
            />
            <Buttons tag={'button'} text={'Hapus toko'}
                settings={{size: 'sm',type: 'light',color: 'red'}}
                icon={{name: 'trash', iconOnly: true}}
                attr={{type: 'button',
                    onClick: () => {
                        confirmPopup('Hapus "'+store.info.name+
                            '" beserta item di dalamnya?',
                            function(IndexStoresItemsView){
                                IndexStoresItemsView.deleteStore(store.info.id)
                            }, null, this
                        )
                    },
                }}
            />  
        </> : '');
        let CardBody_JSX = null;

        if(store.items.size === 0){
            CardBody_JSX = root.viewStatusMsg('Item kosong.'); 
        }
        else{
            CardBody_JSX = (<>
                {root.state.user.guard === 'admin' ? 
                    <section className="flex-row sliding-stats-container">
                        <StatsCard
                            type={'light'} color={'blue'} icon={'price_2'} card_tag={'p'}						
                            main_label={'Total harga produksi'}
                            number_label={'Rp. '+numToPrice(
                                store.statistics.total_production_prices ?
                                store.statistics.total_production_prices : 0
                            )}
                        />
                        <StatsCard
                            type={'light'} color={'blue'} icon={'hanger'} card_tag={'p'}						
                            main_label={'Total item tersimpan'}
                            number_label={(
                                store.statistics.total_items_stored ?
                                store.statistics.total_items_stored : 0
                            )}
                        />					
                    </section> : ''                
                }
                {this.generateStoreItems()}  
            </>);
        }    

        return (
            <SimpleCard
                heading={CardHeading_JSX}
                action={CardActions_JSX}
                body={CardBody_JSX}
                cardTag={'article'} headingTag={'h2'}
                container_classes={'store-card'}
            />            
        );
    }

    generateStoreItems(){
        const root = this.props.root
        const store = this.props.store;
        const items_map = (
            this.state.selected_item !== null ?
            this.state.selected_item :
            store.items
        );
        // Items search box
        const ItemsSearchBox_JSX = (
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
                            onClick={() => {this.getStoreItem(item.id, item.name)}}
                            type="button">
                                {item.name}
                            </button>
                        </li>                        
                    ));                           
                    return (<ul>{Items_JSX}</ul>);
                }}
            />
        );
        // Items search results
        const ItemsSearchResults_JSX = ( this.state.selected_item === null ? '' :
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
        );
        let Items_JSX = [];
        items_map.forEach((item, id) => {
            let total_items = 0;
            for(let size in item.details){
                total_items += parseInt(item.details[size].quantity);
            }
            Items_JSX.push(
                <section key={id} className="flex-row content-space-between items-center item">
                    <h6 className="flex-row items-center">
                        <SVGIcons name={'hanger'} color={'blue'}/>
                        <span className="item-name text-truncate text-capitalize">
                            {item.name}
                        </span>
                    </h6>
                    <p className="flex-row items-center">
                        <Label
                            type={'light'} color={'gray'}
                            attr={{style: {fontSize: '1.36rem'}}}
                            classes={'flex-row content-space-between '+
                            'text-medium total-item-in-store'}
                            text={<>
                                <span>Tersimpan:</span>
                                <span>{total_items}</span>
                            </>}
                        />                           
                        <Buttons tag={'button'} 
                            settings={{size: 'sm',type: 'light',color: 'blue'}}
                            text={'Details'}
                            icon={{ name: 'visible', iconOnly: false }}
                            attr={{type: 'button', onClick: () => {
                                    this.viewStoreItem(item, id);
                                }
                            }}
                        /> 
                    </p>
                </section>
            );
        });        

        const LoadMoreBtn_JSX = (
            this.state.last_row_loaded || this.state.selected_item !== null ? '' :
		    <button className="load-more-btn block text-blue flex-row 
		    items-center content-center" type="button"
		    onClick={this.loadStoreItems}>
		    	<SVGIcons
		    		name={'arrow_to_bottom'} color={'blue'}
		    	/>
		    	Load more
		    </button>	
        );
        return (<>
            {ItemsSearchBox_JSX}
            {ItemsSearchResults_JSX}        
            <div className="items-container">
                {Items_JSX}
            </div>            
            {LoadMoreBtn_JSX}					            
        </>);
    }
    // Load more the store items
    loadStoreItems(){
		const root = this.props.root;

		xhttpPost('', root.props.urls.load_store_items,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){

				root.setState((state) => {
					const loaded_items = root.formatStoreItems(
						JSON.parse(response)
					);						
					let store = {...state.store};
					store.items = new Map([
						...store.items, ...loaded_items
					]);
					store.filters.rows_offset += store.filters.rows_limit;
					return {store: store,dark_lds: false};
				});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );         
    }
    // Get the store items from the search box's search result
    getStoreItem(item_id, item_name){
        const root = this.props.root;
        const store = this.props.store;
        const data = {
            store_id: this.props.store.info.id,
            item_id: item_id
        };
        root.setState({dark_lds: true});
        xhttpPost(serializeObj(data), root.props.urls.get_store_item,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, IndexStoresItemsView){
                const parsed = JSON.parse(response);
                if(parsed.length === 0){
                    alert('Item: "'+item_name+'" tidak ditemukan di '+
                    store.info.name+'.')
                }
                else{
                    IndexStoresItemsView.setState({
                        selected_item: root.formatStoreItems(parsed),
                    });
                }
                root.setState({dark_lds: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }, this
        );         
    }
    // View the details of the store item
    viewStoreItem(item, item_id){
        this.setState(() => {
            let viewed_item = item;
            let updated_item_qt = {};

            viewed_item.id = item_id;
            for(let size in viewed_item.details){
                updated_item_qt[size] = viewed_item.details[size].quantity
            }
            return {
                viewed_item: viewed_item, updated_item_qt: updated_item_qt,
                view_item_modal: true
            };
        })
    }
    // Edit the item quantity of the viewed store item
    editItemQt(size, qt){
        this.setState(state => {
            const updated_item_qt = {...state.updated_item_qt};
            updated_item_qt[size] = parseIfInt(qt);
            return {updated_item_qt: updated_item_qt}
        })
    }
    // Filter the store items
    filterStoreItems(){
        const root = this.props.root;
        let data = serializeObj({
            // If the user is employee, set the store id to
            // the store where employee works            
            store_id: (root.state.user.guard === 'employee' ?
                root.state.user.store.id : this.state.store_id
            ),
            rows_limit: this.state.rows_limit,            
        });

        root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.index_stores,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState((state) => {
                    let store = JSON.parse(response);
                    store.items = root.formatStoreItems(store.items);
                    store.all_stores = formatData(store.all_stores, 'id');                    
					// Convert filters' numeric values to numeric
					for(let key in store.filters){
						const number = Number(store.filters[key]);
						if(number !== NaN || number === 0)
							store.filters[key] = number;
					}
                    return {store: store, dark_lds: false};
                });
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );        
    }

	handleChange(e, is_int = false){
		const form = e.target;
        const value = (is_int ? 
            (form.value ? parseInt(form.value) : form.value) : form.value
        );

		this.setState({
            [form.name]: value
        });
	}

    generateTransferItemModal(){
        const root = this.props.root;

        const StoresForms_JSX = (<>
            <Select
                type={'outline'} size={'md-input'} 
                form_name={'origin_store_id'} label={'Toko asal'}
                options={(() => {
                    let options = [{value: '', text: 'Pilih toko'}];
                    if(this.props.store !== undefined){
                        this.props.store.all_stores.forEach((store, store_id) => {
                            options.push({
                                value: store_id, text: store.name,
                                attr: {
                                    disabled: (
                                        store_id === this.state.target_store_id ? 
                                        true : false
                                    )
                                }
                            });
                        });
                    }
                    return options
                })()}
                form_attr={{
                    value: this.state.origin_store_id,
                    onChange: (e) => {this.handleChange(e,true)},
                }}
            />
            <Select
                type={'outline'} size={'md-input'} 
                form_name={'target_store_id'} label={'Toko Tujuan'}
                options={(() => {
                    let options = [{value: '', text: 'Pilih toko'}];
                    if(this.props.store !== undefined){
                        this.props.store.all_stores.forEach((store, store_id) => {
                            options.push({
                                value: store_id, text: store.name,
                                attr: {
                                    disabled: (
                                        store_id === this.state.origin_store_id ? 
                                        true : false
                                    )
                                }
                            });
                        });
                    }
                    return options
                })()}
                form_attr={{
                    value: this.state.target_store_id,
                    onChange: (e) => {this.handleChange(e,true)},
                }}
            />  
        </>);
        const ItemsSearchBox_JSX = (
            <SearchBox
                form_name={'item_name'} size={'md-input'} label={'Pilih Item'}
                addon={<SVGIcons  name={'search'} color={'blue'} />}
                request_url={root.props.urls.search_items_storage}
                request_headers={{'X-CSRF-TOKEN': root.props.csrf_token}}
                container_classes={'items-search-box'}                
                form_attr={{
                    disabled: (this.state.origin_store_id ? false : true),
                    type:'text', placeholder: 'Cari item',
                    autoComplete: 'off',
                }}
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
                            onClick={() => {this.getItemForTransfer(item.id, item.name)}}
                            type="button">
                                {item.name}
                            </button>
                        </li>                        
                    ));                           
                    return (<ul>{Items_JSX}</ul>);
                }}
            />  
        );
        const ItemsQuantitiesForms_JSX = (
			<Grid
				columns={'3'}
                items={root.props.accepted_item_sizes.map((size) => (
                    <TextInput
                        form_name={'transfered-item-quantity-'+size}
                        size={'md-input'} type={'outline'}
                        container_classes={'production-price-forms'}
                        label={
                            <span>
                                <span>{'Jumlah ('+size.toUpperCase()+')'}</span>
                                <span className="inline-block text-blue"
                                style={{marginLeft: '0.4rem'}}>
                                    {'* '+this.state.quantities[size].quantity_left}
                                </span>
                            </span>
                        }
                        form_attr={{
                            disabled: (
                                this.state.quantities[size].is_available ?
                                false : true
                            ),
                            max: this.state.quantities[size].max_quantity, min: 0,
                            type: 'number', inputMode: 'numeric', pattern: '[0-9]*',
                            value: this.state.quantities[size].quantity,
                            onChange: (e) => {this.handleQuantityChange(e, true)},
                        }}
                    />
                ))}
			/>            
        );
        return (
            <Modal
                toggleModal = {() => {this.toggleModal('transfer_items_modal')}}
                modalShown = {this.state.transfer_items_modal}
                classes={'transfer-items-modal'}
                heading={'Transfer Item'} footer_align={'center'}
                body={<>
                    <KanbanBoard
                        heading={'Toko Asal dan Tujuan'}
                        body={StoresForms_JSX} type={'light'}
                    />
                    <KanbanBoard
                        heading={'Item: '+
                            (this.state.item_name ? this.state.item_name : 'belum dipilih')
                        }
                        body={<>
                            {ItemsSearchBox_JSX}
                            {ItemsQuantitiesForms_JSX}
                        </>}
                        type={'light'}
                    />                                                        
                </>}
                footer={
                    <Buttons tag={'button'} text={'Transfer'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', style: {width: '10rem'},
                            onClick: this.tranferItems,
                        }}
                    />            
                }
            />  
        );
    }  

    getItemForTransfer(item_id, item_name){
        const root = this.props.root;

        const data = {
            store_id: this.state.origin_store_id,
            item_id: item_id
        };
        root.setState({dark_lds: true});
		xhttpPost(
            serializeObj(data),
            root.props.urls.get_store_item,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            (response, status_code, StoresView) => {
                const parsed = JSON.parse(response);
                const store_name = this.props.store.all_stores.get(
                    this.state.origin_store_id
                ).name;

                if(parsed.length === 0){
                    alert(
                        'Item: "'+item_name+'" tidak tersedia '+
                        'di '+store_name+'.'
                    );
                }
                else{
                    StoresView.setState((state) => {
                        let quantities = {...state.quantities};
                        const item_in_store = JSON.parse(parsed[0].store_items)[item_id];
                        for(let size in quantities){
                            quantities[size] = {
                                quantity: '',
                                quantity_left: (
                                    item_in_store[size] ? 
                                    item_in_store[size].quantity : 0
                                ),
                                is_available: (
                                    item_in_store[size] && 
                                    item_in_store[size].quantity !== 0 ? 
                                    true : false
                                ),
                                max_quantity: (
                                    item_in_store[size] ? 
                                    item_in_store[size].quantity : 0
                                ),
                            };
                        }

                        return {
                            item_id: item_id,
                            item_name: item_name,
                            quantities: quantities,
                        };
                    });
                }
                root.setState({dark_lds: false});
            },
            (response, status_code) => {
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: true});
            }, this
        );          
    }

    handleQuantityChange(e){
        const form = e.target;
        const item_size = form.name.split('-')[3];
		const value = (form.value ? parseInt(form.value) : form.value);
        this.setState((state) => {
            let quantities = {...state.quantities};

            quantities[item_size].quantity = value;
            quantities[item_size].quantity_left = (
                quantities[item_size].max_quantity - 
                (value ? value : 0)
            );
            return {quantities: quantities};
        });
    }

    tranferItems(){
        const root = this.props.root;
        const item_name = this.state.item_name;
        const data = {
            item_id: this.state.item_id,
            origin_store_id: this.state.origin_store_id,
            target_store_id: this.state.target_store_id,
            quantities: (() => {
                let quantities = {};
                for(let size in this.state.quantities){
                    if(this.state.quantities[size].quantity)
                        quantities[size] = this.state.quantities[size].quantity;
                }
                return JSON.stringify(quantities);
            })(),
        };
        root.setState({dark_lds: true});
        xhttpPost(serializeObj(data), root.props.urls.transfer_store_items,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                alert('Item "'+item_name+'" berhasil ditransfer.');
                root.setState({store: undefined,dark_lds: false,});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );         
        
    }    
    // Create a store
    createStore(){
        const root = this.props.root;
        const data = serializeObj({
            name: this.state.name, active_store: this.state.active_store
        });

        root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.store_stores,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState({store: undefined,dark_lds: false});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );
    }
    // Update a store
    updateStore(store_id, name){
        const root = this.props.root;
        const data = serializeObj({id: store_id, name: name});

        root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.update_stores,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState((state) => {
                    let store = {...state.store};
                    store.info.name = name;
                    store.all_stores.get(store_id).name = name;
                    return {store: store, dark_lds: false};
                });
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );        
    }
    // Prepare to update the store item
    initUpdateItem(item, size){
        const store = this.props.store;
        console.log(item)
        this.setState(() => {
            // Get the updated item

            let changed_states = {
                item_id: item.id,
                item_name: item.name+' ('+size.toUpperCase()+')',
                item_size: size,
                item_quantity: item.details[size].quantity,
                update_item_modal: true,
            }
            return changed_states;
        });
    }
    // Update the store item
    updateItem(){
        const root = this.props.root;
        const store = this.props.store;
        let updated_quantities = {};
        // Get the updated item quantity
        for(let size in this.state.updated_item_qt){
            // If the item quantity is really updated
            if(
                this.state.updated_item_qt[size] !==
                this.state.viewed_item.details[size].quantity
            ){
                updated_quantities[size] = {
                    quantity: this.state.updated_item_qt[size]
                };
            }
        }        
        if(Object.keys(updated_quantities).length === 0){
            alert('Tidak ada perubahan');
        }
        else{
            // Prepare the data to be sent
            const data = {
                store_id: store.info.id,
                items: JSON.stringify(
                    this.props.parent.formatItemsForStoring(new Map([[
                        0,
                        {
                            id: this.state.viewed_item.id,
                            details: updated_quantities
                        }
                    ]]))
                )
            };
            root.setState(({dark_lds: true}));
            xhttpPost(
                serializeObj(data),
                root.props.urls.update_store_items,
                {'X-CSRF-TOKEN': root.props.csrf_token},
                (response, status_code, IndexStoresItemsView) => {
                    alert(
                        'Success!\nItem: "'+this.state.viewed_item.name+'" pada '+
                        this.props.store.info.name+' berhasil di-update.'
                    );
                    root.setState(({dark_lds: false}));
                    IndexStoresItemsView.refreshPage(true);
                },
                function(response, status_code, IndexStoresItemsView){
                    root.xhrFailCallback(response, status_code);
                    root.setState({dark_lds: false});
                }, this
            );            
        }

    }

    toggleModal(modal){
        this.setState((state) => ({
            [modal]: !state[modal]
        }));
    }

    refreshPage(force = false){
        if(this.props.store === undefined || force){
            this.props.root.refreshStore(force);
        }
    }

    componentDidMount(){;
        this.props.root.scrollToTop();
        this.refreshPage();
    }

    componentDidUpdate(prevProps,prevState){
        if(prevProps.store !== this.props.store){
            const current_store = this.props.store;

            let changed_states = {
                selected_item: null,
                filter_store_items_modal: false,
                add_store_modal: false,
                update_item_modal: false,
                view_item_modal: false,
                transfer_items_modal: false,
                // Reset the selected items for transfer
                item_id: '',
                item_name: '',
                quantities: (() => {
                    let quantities = {...this.state.quantities};
                    for(let size in quantities){
                        quantities[size] = {
                            quantity: '',
                            quantity_left: 0,
                            max_quantity: 0,
                            is_available: false                            
                        };
                    }
                    return quantities;
                })(),                   
            };
            // If the store is undefined, refresh the store again
            if(current_store === undefined){
                this.setState(changed_states);
                this.refreshPage();
            }
            else{
                changed_states.last_row_loaded = this.props.root.detectLastRows(
                    current_store.items.size,
                    current_store.filters.rows_offset,
                    current_store.filters.rows_limit
                );             
                this.setState(changed_states);
            }
        }
        // When the origin store is changed, reset the selected item
        // for transfer
        if(prevState.origin_store_id !== this.state.origin_store_id){
            this.setState({
                item_id: '',
                item_name: '',
                quantities: (() => {
                    let quantities = {...this.state.quantities};
                    for(let size in quantities){
                        quantities[size] = {
                            quantity: '',
                            quantity_left: 0,
                            max_quantity: 0,
                            is_available: false                            
                        };
                    }
                    return quantities;
                })(),                   
            })
        }        
    }

	render(){
        const root = this.props.root;
        const parent = this.props.parent;
        let AddStoreBtn = null;
        let AddStoreItemBtn = null;
        let TransferStoreItemBtn = null;
        let TransferStoreItemBtnModal = null;

        if(root.state.user.guard === 'admin'){
            AddStoreBtn = (
                <Buttons tag={'button'} text={'+ Tambah toko'}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    attr={{type: 'button', style: {width: '12rem'},
                        onClick: () => {this.toggleModal('add_store_modal')},
                    }}
                />                
            );
            AddStoreItemBtn = (
                <button type="button" className="flex-row items-center floating-btn btn text-white"
                disabled={(
                    this.props.store === undefined || this.props.store.info === null ?
                    true : false
                )}
                onClick={() => {parent.changeView(1)}}
                style={{backgroundColor: '#4A7DFF',}}>
                    +
                    <SVGIcons
                        name={'hanger'}
                        color={'white'}
                        attr={{style: {width: '2em'}}}
                    />                        
                </button>   
            );
        }
        if(root.state.user.guard === 'employee'){
            TransferStoreItemBtn = (
                <Buttons tag={'button'} text={'Transfer item'}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    icon={{name: 'share'}}
                    attr={{type: 'button', style: {width: '14rem',marginLeft: '1rem'},
                        onClick: () => {this.toggleModal('transfer_items_modal')},
                    }}
                />                  
            );
            TransferStoreItemBtnModal = this.generateTransferItemModal();
        }
		return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'home_2'} color={'blue'}
						attr={{style: {width: '1.6em'}}}
					/>						
					Toko &#38; Gudang
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
            <section className="flex-row content-end items-center"
            style={{marginBottom: '2rem'}}>
                {AddStoreBtn}
                {TransferStoreItemBtn}        
                <Buttons tag={'button'} text={'Filter item'}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    icon={{name: 'sort_1'}}
                    attr={{type: 'button', style: {width: '12rem',marginLeft: '1rem'},
                        onClick: () => {this.toggleModal('filter_store_items_modal')},
                    }}
                />
                {AddStoreItemBtn}                                   
            </section>            
            {this.generateStoreDetails()}
            <Modal 
                toggleModal = {() => {this.toggleModal('add_store_modal')}}
                modalShown = {this.state.add_store_modal}
                heading = {'Tambah Toko/Gudang'} attr={{id: 'add-store-modal'}}
                footer_align={'center'} classes={'content-sized-modal'}                
                body = {<>
					<TextInput type={'outline'}
						label={'Nama toko/gudang'}
						form_name={'name'} size={'md-input'}
						form_attr={{style: {width: '100%'},
                            type: 'text', value: this.state.name,
                            onChange: (e) => {this.handleChange(e)}
						}}
						container_attr={{style: {width: '100%'}}}
					/>
                    <section style={{marginTop: '2rem'}}>
                        <h6 className="text-regular"
                        style={{fontSize: '1.4rem', marginBottom: '0.8rem'}}>
                            Tambahkan Sebagai
                        </h6>
                        <Radio form_name={'active_store'} type={'outline'}
                            label={'Gudang'} value={0}
                            form_attr={{
                                checked: (this.state.active_store === 0),
                                onChange: (e) => {this.handleChange(e, true)}
                            }}
                            container_attr={{style: {marginRight: '2rem'}}}
                        />
                        <Radio form_name={'active_store'} type={'outline'}
                            label={'Toko'} value={1}
                            form_attr={{
                                checked: (this.state.active_store === 1),
                                onChange: (e) => {this.handleChange(e, true)}
                            }}                            
                        />                       
                    </section>            
                </>}
                footer={
                    <Buttons tag={'button'} text={'Tambahkan'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{style: {width: '12rem'}, type: 'button', onClick: this.createStore}}
                    />            
                }
            />
            <Modal
                toggleModal = {() => {this.toggleModal('filter_store_items_modal')}}
                modalShown = {this.state.filter_store_items_modal}
                heading = {'Filter Item Toko & Gudang'}
                footer_align={'center'} classes={'content-sized-modal'}                
                body={<>
                    {root.state.user.guard === 'admin' ?
                    <Select
                        type={'outline'} size={'md-input'} form_name={'store_id'}
                        label={'Nama toko/gudang'}
                        options={(() => {
                            let options = [{value: '', text: 'Pilih'}];
                            if(this.props.store !== undefined){
                                this.props.store.all_stores.forEach((store, store_id) => {
                                    options.push({
                                        value: store_id,
                                        text: store.name
                                    });
                                });
                            }
                            return options;
                        })()}
                        form_attr={{value: this.state.store_id,
                            style: {marginBottom: '2rem',width: '100%'},
                            onChange: (e) => {this.handleChange(e, true)},
                        }}
                        container_attr={{style: {width: '100%'}}}
                    /> : ''
                    }
                    <Select
                        type={'outline'} size={'md-input'} form_name={'rows_limit'}
                        label={'Jumlah item ditampilkan'}
                        options={[{value: 6},{value: 12},{value: 20}]}
                        form_attr={{value: this.state.rows_limit,
                            style: {width: '100%'},
                            onChange: (e) => {this.handleChange(e,true)},
                        }}
                        container_attr={{style: {width: '100%'}}}
                    />                       
                </>}
                footer={
                    <Buttons tag={'button'} text={'Filter'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', style: {width: '10rem'},
                            onClick: this.filterStoreItems,
                        }}
                    />            
                }
            />
            <Modal 
                toggleModal={() => {this.toggleModal('view_item_modal')}}
                modalShown={this.state.view_item_modal}
                heading={'Detail Item'} container_attr={{id: 'update-item-modal'}}
                footer_align={'center'}
                body={(() => {
                    if(this.state.viewed_item === null)
                        return '';
                    let total_items = 0;
                    let total_production_prices = 0;
                    // The item table's heading
                    let TableHeadings = ['Ukuran','Jumlah','Terakhir Diubah'];
                    if(this.props.store.info.active_store){
                        TableHeadings.splice(2, 0, 'Harga Jual');
                    }
                    // Make sure only admin can see production price
                    if(root.state.user.guard === 'admin'){
                        TableHeadings.splice(2, 0, 'Harga Produksi');
                    }                                    
                    // The store item table's body
                    let TableBody = [];
                    root.props.accepted_item_sizes.forEach((size) => {
                        // View or edit (admin only) item quantity
                        const item_quantity = (
                            root.state.user.guard === 'admin' ?
                            <span className="flex-row items-center">
                                <TextInput 
                                    form_name={'item_quantity'} type={'outline'} size={'md-input'} 
                                    form_attr={{type: 'number', inputMode: 'numeric',
                                        min: 0, pattern: '[0-9]*', style: {width: '8rem'},
                                        value: this.state.updated_item_qt[size],
                                        onChange: (e) => this.editItemQt(size, e.target.value)
                                    }}
                                />
                                <button type="button" onClick={() => this.editItemQt(
                                    size, this.state.viewed_item.details[size].quantity
                                )} style={{fontSize: '2rem', paddingLeft: '0.6rem'}}>
                                    <span className="sr-only">Reset</span>
                                    <SVGIcons name={'update'} color={'blue'} />
                                </button>
                            </span> : 
                            <span className="items-center" style={{display: 'inline-flex'}}>
                                {this.state.viewed_item.details[size].quantity}
                            </span>                                                                             
                        )
                        total_items += parseInt(this.state.viewed_item.details[size].quantity);
                        total_production_prices += parseInt(
                            this.state.viewed_item.details[size].production_price
                        );
                        let TableRow = [];
                        TableRow.push(
                            <span className="text-uppercase">
                                {size}
                            </span>,
                            item_quantity,
                            (
                                this.state.viewed_item.details[size].updated_at ?
                                prettyTime(
                                    this.state.viewed_item.details[size].updated_at, true
                                ) :
                                <span className="text-red">Belum ada</span>
                            ),
                        );
                        // If the store is active store, add selling price column
                        if(this.props.store.info.active_store){
                            TableRow.splice(2, 0, (
                                this.state.viewed_item.details[size].selling_price ?
                                'Rp. '+numToPrice(
                                    this.state.viewed_item.details[size].selling_price
                                ) :
                                <span className="text-red">Belum ada</span>
                            ));
                        }
                        if(root.state.user.guard === 'admin'){
                            TableRow.splice(2, 0,
                                this.state.viewed_item.details[size].production_price ?
                                'Rp. '+numToPrice(
                                    this.state.viewed_item.details[size].production_price
                                ) :
                                <span className="text-red">Belum ada</span>               
                            );
                        }                    
                        TableBody.push(TableRow);
                    });                     
                    return (<>
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
                        <Table
                            headings={TableHeadings}
                            body={TableBody} container_attr={{style: {fontSize: '1.46rem'}}}
                            container_classes={'items-table'}
                        />
                        <aside className="flex-col text-dark-65" style={{fontSize: '1.46rem'}}>
                            <span className="flex-row content-space-between"
                            style={{borderTop: '0.1rem solid #D9D9D9',padding: '0.8em 0'}}>
                                <span>Total tersimpan:</span>
                                <span>{total_items}</span>
                            </span>
                            {(root.state.user.guard === 'employee' ? '' :
                            <span className="flex-row content-space-between"
                            style={{borderTop: '0.1rem solid #D9D9D9',padding: '0.8em 0 0'}}>
                                <span>Total harga produksi:</span>
                                <span>{'Rp. '+numToPrice(total_production_prices)}</span>
                            </span>                            
                            )}
                        </aside>
                    </>);                        
                })()}
                footer={(root.state.user.guard === 'admin' ?
                    <Buttons 
                        tag={'button'} text={'Simpan perubahan'}
                    	settings={{size: 'md', type: 'primary', color: 'blue'}}
                        attr={{type: 'button', onClick: this.updateItem}}
                    /> : ''
                )}
            />                      
            {TransferStoreItemBtnModal}
        </>);
	}
}	