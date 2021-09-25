import React from 'react';

import {Buttons} from './../../Buttons.js';
import {TextInput, TextInputAddon, SearchBox} from './../../Forms.js';
import {SectionHeader, Grid} from './../../Layouts.js';
import {ToolCard} from './../../Cards.js';
import {SVGIcons} from './../../UtilityComponents.js';
import {Modal} from './../../Windows.js';
import {xhttpPost, serializeObj,parseIfInt} from './../../Utilities.js';


export default class AddStoreItemsView extends React.Component{
	constructor(props){
		super(props);

		this.state = {
            // A new item to be stored to the storage
            new_item: null,
            // Edit size details
            edit_size_details_modal: false,
            edit_size_details_modal_heading: '',
            item_key: null,
            size_details: null,
            // New Items to be stored to the store
			items: new Map(),
            new_item_modal: false,

            tool_cards: new Map(),
		};

        this.toggleItem = this.toggleItem.bind(this);
		this.generateItems = this.generateItems.bind(this);
        this.generateItemSizeDetails = this.generateItemSizeDetails.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.initEditSizeDetails = this.initEditSizeDetails.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.editSizeDetails = this.editSizeDetails.bind(this);
		this.storeItems = this.storeItems.bind(this);
        this.initNewStorageItem = this.initNewStorageItem.bind(this);
        this.handleNewStorageItem = this.handleNewStorageItem.bind(this);
        this.storeNewStorageItem = this.storeNewStorageItem.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.toggleToolCard = this.toggleToolCard.bind(this);
        this.refreshPage = this.refreshPage.bind(this);
	}
    // Add new item
    toggleItem(item_key = null){
		if(item_key === null){
            const accepted_item_sizes = this.props.root.props.accepted_item_sizes;
            const store = this.props.store;

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
                                details[size] = {};
                                details[size].quantity = '';
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

    selectItem(item_key, item_id, item_name){
        const root = this.props.root;
        const store = this.props.store;

        const data = {
            store_id: this.props.store.info.id,
            item_id: item_id
        };
        root.setState({dark_lds: true});
		xhttpPost(
            serializeObj(data),
            root.props.urls.get_store_item,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, AddStoreItemsView){
                const parsed = JSON.parse(response);

                if(parsed.length === 1){
                    alert(
                        'Item: "'+parsed[0].item_name+'" sudah ditambahkan '+
                        'ke dalam '+store.info.name+'.'
                    );
                }
                else{
                    AddStoreItemsView.setState((state) => {
                        let items = new Map([...state.items]);
                        items.get(item_key).id = parseInt(item_id);
                        items.get(item_key).name = item_name
            
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
    // Generate added items
	generateItems(){
        const root = this.props.root;
        let ItemCards_JSX = [];

        if(this.state.items.size === 0){
            return root.viewStatusMsg('Item belum ditambahkan.');
        }

		this.state.items.forEach((item, item_key) => {
            let CardBodyJSX = (<>
                <section style={{marginBottom: '1.6rem'}}>
                    <div className="flex-row content-space-between items-start">
                        <h6 className="text-medium text-dark-65"
                        style={{width: '100%', fontSize: '1.56rem', marginBottom: '1rem'}}>
                            Pilih Item
                        </h6>
                        <button className="text-blue inline-block"
                        style={{fontSize: '1.4rem', flexShrink: 0}}
                        type="button" onClick={this.initNewStorageItem}>
                            Item tidak ada? Buat baru
                        </button>
                    </div>
                    <SearchBox
                        form_name={'item_name'} addon={'Cari item'} size={'md-input'}
                        container_classes={'items-search-box'}
                        request_url={root.props.urls.search_items_storage}
                        addon={<SVGIcons  name={'search'} color={'blue'} />}
                        request_headers={{
                            'X-CSRF-TOKEN': root.props.csrf_token
                        }}
                        form_attr={{
                            type:'text', autoComplete: 'off',
                            placeholder: 'Cari item',
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
                </section>
                {this.generateItemSizeDetails(item, item_key)}
            </>);
            ItemCards_JSX.push(
                <ToolCard
                    key={item_key} tag={'article'} heading_tag={'h2'}
                    expanded={this.state.tool_cards.get(item_key)}
                    attr={{style: {marginBottom: '2rem'}}}   
                	heading={item.name} body={CardBodyJSX}                 
                	toggle_button={
						<Buttons 
                            tag={'button'} text={'Toggle expand'} 
							settings={{size: 'sm',type: 'light',color: 'blue'}}
                            icon={{name: 'angle_up', iconOnly: true}}
                            classes={'toggle-btn'}
							attr={{onClick: () => {this.toggleToolCard(item_key)}}}
						/>	                        
                    } 
                	right_side_actions={
						<Buttons 
                            tag={'button'} text={'Toggle expand'} 
							settings={{size: 'sm',type: 'light',color: 'red'}}
                            icon={{name: 'close', iconOnly: true}}
							attr={{onClick: () => {this.toggleItem(item_key)}}}
						/>	                        
                    }
                />                
            );           
		});
		return ItemCards_JSX;
	}    
    // Generate added item forms
    generateItemSizeDetails(item, item_key){
        const root = this.props.root;
        const Heading = 'Jumlah Item';
        return (
        <section className="size-details">
            <div className="flex-row items-center">
                <h6 className="heading text-medium text-dark-65" style={{fontSize: '1.56rem'}}>
                    {Heading}
                </h6>
                <button className="action-btn flex-row items-center text-blue"
                disabled={(item.id ? false : true)} type="button"
                onClick={() => {this.initEditSizeDetails(item_key)}}>
                    <SVGIcons name={'write'} color={'blue'}/>
                    <span className="block">Edit</span>
                </button>
            </div>
            <ul className="sizes-grid">
                {(root.props.accepted_item_sizes.map((size, idx) => (
                <li key={idx} className="size flex-row content-space-between">
                    <span>{'Ukuran '+size.toUpperCase()}</span>
                    <span>{item.details[size].quantity ? item.details[size].quantity : 0}</span>
                </li>
                )))}
            </ul>                              
        </section>
        );
    }

    initEditSizeDetails(item_key){
        this.setState((state) => {
            const item = state.items.get(item_key)
            const modal_heading = ('Ubah Jumlah Item');
            const size_details = (() => {
                let size_details = {};
                this.props.root.props.accepted_item_sizes.forEach((size) => {
                    size_details[size] = {};
                    size_details[size].quantity = item.details[size].quantity;
                });
                return size_details;
            })();
            return {
                edit_size_details_modal: true,
                edit_size_details_modal_heading: modal_heading,
                item_key: item_key,
                size_details: size_details
            };
        });        
    }

    handleQuantityChange(e){
        const form = e.target;
        const form_name = e.target.name;
        const size = form_name.split('-')[1];
		const value = parseIfInt(form.value);

		this.setState((state) => {
            let size_details = {...state.size_details};
            size_details[size].quantity = value;
            return {size_details: size_details};
		});        
    }

    editSizeDetails(){
        this.setState((state) => {
            let items = new Map([...state.items]);
            items.get(state.item_key).details = state.size_details;
            return {
                items: items,
                edit_size_details_modal: false,
            }
        });
    }
    // Store the added items to the current store
	storeItems(){
 		const root = this.props.root;
		const parent = this.props.parent;
        const data = {
            store_id: root.state.store.info.id,
            items: JSON.stringify(parent.formatItemsForStoring(this.state.items))
        };

		root.setState(({dark_lds: true}));
		xhttpPost(
            serializeObj(data),
            root.props.urls.update_store_items,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState(({dark_lds: false}));
                root.refreshStore(true);
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
				root.setState({dark_lds: false});
            }
        );
	}
    // Init storing a new item to the storage
    initNewStorageItem(){
        const root = this.props.root;

        this.setState((state) => {
            return {
                new_item: {
                    name: '',
                    production_prices: (() => {
                        let production_prices = {};
                        root.props.accepted_item_sizes.forEach((size) => {
                            production_prices[size] = '';
                        });
                        return production_prices;
                    })(),
                    selling_prices: (() => {
                        let selling_prices = {};
                        root.props.accepted_item_sizes.forEach((size) => {
                            selling_prices[size] = '';
                        });
                        return selling_prices;
                    })(),                                          
                },
                new_item_modal: true
            };
        });
    }

    handleNewStorageItem(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (is_int ? parseIfInt(form.value) : form.value);

		this.setState((state) => {
            let new_item = {...state.new_item};
            if(form_name === 'name'){
                new_item.name = value;	
            }
            else{
                const size = form_name.split('-')[2];
                const price_type = form_name.split('-')[0];
                switch(price_type){
                    case 'production':
                        new_item.production_prices[size] = value;
                        break;
                    case 'selling':
                        new_item.selling_prices[size] = value;
                        break;
                    default: null;                  
                }              
            }

            return {new_item: new_item};
		});
    }
    // Store the new item to the storage
    storeNewStorageItem(){
        const root = this.props.root;
        let new_item_map = new Map();
        new_item_map.set(
            1, {
                name: this.state.new_item.name,
                production_prices: this.state.new_item.production_prices,
                selling_prices: this.state.new_item.selling_prices,
            }
        );
        const data = JSON.stringify(root.formatItemsForStoring(new_item_map));
        
		root.setState(({dark_lds: true}));
		xhttpPost(
			'items='+data,
			root.props.urls.store_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            (response, status_code, AddStoreItemsView) => {
                alert('Item: "'+this.state.new_item.name+'" berhasil dibuat');
                root.setState({dark_lds: false});
                AddStoreItemsView.toggleModal('new_item_modal');

            },
            function(response, status_code, AddStoreItemsView){
                root.xhrFailCallback(response, status_code);
				root.setState({dark_lds: false});
            }, this
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
    
    refreshPage(force = false){
        if(this.props.store === undefined || force){
            this.props.root.refreshStore(force);
        }
    }    

    componentDidMount(){
        this.props.root.scrollToTop();
    }

    componentDidUpdate(prevProps){
        // When new items is added to the store
        // change the view
        if(prevProps.store !== this.props.store){
            this.props.parent.changeView(0);
        }      
    }

	render(){
        const root = this.props.root;
		return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
                    <button type="button" onClick={() => {this.props.parent.changeView(0)}}>
                        <SVGIcons name={'angle_left'} color={'blue'}
                            attr={{style: {width: '1.6em'}}}
                        />
                        <span className="sr-only">Back</span>
                    </button>					
					{'Tambah Item'}
                    <span className="text-dark-50"
                    style={{fontSize: '1.6rem', marginLeft: '0.2em', fontWeight: 400}}>
                        {'| '+this.props.store.info.name}
                    </span>
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
				text={'Simpan'}
				classes={'block'}
				attr={{
					style: {margin: '0 auto', width: '14rem',},
					onClick: this.storeItems
				}}
			/>
            <Modal heading = {'Buat Item Baru'}
                body = {(() => {
                    if(this.state.new_item === null)
                        return '';
                    return (<>
                    <div style={{marginBottom: '1.2rem'}}>
                        <TextInput form_name={'name'} size={'sm-input'}
                            type={'outline'} label={'Nama Item'}
                            form_attr={{
                                type: 'text', value: this.state.new_item.name,
                                style: {width: '100%'},
                                onChange: (e) => {this.handleNewStorageItem(e)},
                            }}
                            container_attr={{style: {width: '100%'}}}
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
                                    value: this.state.new_item.production_prices[size],
                                    onChange: (e) => {this.handleNewStorageItem(e)},
                                }}
                                container_attr={{style: {width: '100%'}}}
                            />
                            <TextInputAddon 
                                form_name={'selling-price-'+size}
                                size={'md-input'} addon={'Rp'} type={'outline'}
                                label={'Harga Jual ('+size.toUpperCase()+')'}
                                form_attr={{style: {width: '100%'}, min: 0,
                                    type: 'number', inputMode: 'numeric', pattern: '[0-9]*',
                                    value: this.state.new_item.selling_prices[size],
                                    onChange: (e) => {this.handleNewStorageItem(e)},
                                }}
                                container_attr={{style: {width: '100%', marginLeft: '2rem'}}}
                            />                                                  
                        </div> 	
                        ))}																	
                    </section>	                     
                    </>);
                })()}
                toggleModal={() => {this.toggleModal('new_item_modal')}}
                modalShown={this.state.new_item_modal}
                footer={
                    <Buttons tag={'button'} text={'Simpan'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', onClick: this.storeNewStorageItem,
                            style: {width: '14rem'}
                        }}
                    />                    
                }
                footer_align={'center'}
            />
            <Modal
                toggleModal={() => {this.toggleModal('edit_size_details_modal')}}
                heading={this.state.edit_size_details_modal_heading}
                modalShown={this.state.edit_size_details_modal}
                body={(() => {
                    if(this.state.item_key === null)
                        return '';
                    const item_name = (
                        <p className="text-center"
                        style={{paddingBottom: '1.6rem', marginBottom: '1.6rem',
                        borderBottom: '2px solid #EBEDF3'}}>
                            {'Item: '+this.state.items.get(this.state.item_key).name}
                        </p>                        
                    );

                    return (<>
                        {item_name}
                        <Grid
                            columns={'3'}
                            items={root.props.accepted_item_sizes.map((size, idx) => (
                                <TextInput 
                                    key={idx} form_name={'quantity-'+size}
                                    size={'md-input'} type={'outline'}
                                    label={'Jumlah '+size.toUpperCase()}
                                    form_attr={{ style: {width: '100%'}, min: 0,
                                        type: 'number', inputMode: 'numeric', pattern: '[0-9]*',
                                        value: this.state.size_details[size].quantity,
                                        onChange: (e) => {this.handleQuantityChange(e)},
                                    }}
                                    container_attr={{style: {width: '100%'}}}
                                />                                
                            ))}
                            container_classes={'production-price-forms'}
                        />                            
                    </>);
                })()}
                footer={
                    <Buttons tag={'button'} text={'Simpan'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', onClick: this.editSizeDetails,
                            style: {width: '14rem'}
                        }}
                    />                    
                }
                footer_align={'center'}
            />                  		
        </>);
	}
}	