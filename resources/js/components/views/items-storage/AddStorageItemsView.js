import React from 'react';

import {Buttons} from './../../Buttons.js';
import {TextInput, TextInputAddon} from './../../Forms.js';
import {SectionHeader} from './../../Layouts.js';
import {SimpleCard} from './../../Cards.js';
import {SVGIcons} from './../../UtilityComponents.js';
import {xhttpPost,parseIfInt, serializeObj} from './../../Utilities.js';

export default class AddStorageItemsView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			items: new Map(),
		};

		this.generateItems = this.generateItems.bind(this);
		this.toggleItem = this.toggleItem.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handlePriceChange = this.handlePriceChange.bind(this);
		this.storeItems = this.storeItems.bind(this);
	}

	generateItems(){
		const root = this.props.root;
		if(this.state.items.size === 0)
			return this.props.root.viewStatusMsg('Item belum ditambahkan.');

		let items_jsx = [];
		this.state.items.forEach((item, item_key) => {
			let card_body = <>
				<div style={{marginBottom: '1.2rem'}}>		
					<TextInput type={'outline'}
						label={'Nama Item'}
						form_name={'name'} size={'md-input'}
						form_attr={{
							type: 'text', value: item.name,
							['data-item-key']: item_key,
							onChange: (e) => {this.handleChange(e)}
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
                                value: item.production_prices[size], ['data-item-key']: item_key,
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
                                value: item.selling_prices[size], ['data-item-key']: item_key,
                                onChange: (e) => {this.handlePriceChange(e)},
                            }}
                            container_attr={{style: {width: '100%', marginLeft: '2rem'}}}
                        />                                                  
                    </div> 	
					))}																	
				</section>							
			</>;
			items_jsx.push(
				<SimpleCard
					key={item_key}
					heading={item.name}
					body={card_body}
					action={
						<Buttons tag={'button'} 
							settings={{size: 'sm',type: 'light',color: 'red'}}
							text={'Hapus item'} icon={{name: 'close', iconOnly: true}}
							attr={{
								onClick: () => {this.toggleItem(item_key)}
							}}
						/>						
					}
					cardTag={'article'}
					headingTag={'span'}
					container_classes={'create-item-card'}
				/>
			);
		});
		return items_jsx;
	}

	toggleItem(item_key = null){
		const root = this.props.root;

		if(item_key === null){
			this.setState((state) => {
				let items = new Map([...state.items]);
                let item_key = [...items.keys()].pop();
                item_key = (item_key ? item_key + 1 : 1);
				items.set(
					item_key, 
					{
						name: 'Item '+item_key,
						production_prices: (() => {
							let production_prices = {}

							root.props.accepted_item_sizes.forEach((size) => {
								production_prices[size] = '';
							});
							return production_prices
						})(),
						selling_prices: (() => {
							let selling_prices = {}

							root.props.accepted_item_sizes.forEach((size) => {
								selling_prices[size] = '';
							});
							return selling_prices
						})(),						
					}
				);
				return {items: items};
			});
		}
		else{
			this.setState((state) => {
				let items = state.items;
				items.delete(item_key);
				return {items: items};
			});
		}
	}

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const item_key = parseInt( form.getAttribute('data-item-key') );
		const value = (is_int ? parseIfInt(form.value) : form.value);

		this.setState((state) => {
			let items = new Map([...state.items]);
			items.get(item_key)[form_name] = value;
			return {items: items};
		});
	}

	handlePriceChange(e){
		const form = e.target;
		const form_name = form.name;		
		const item_key = parseInt(form.getAttribute('data-item-key'));
		const price_type = form_name.split('-')[0]; 
		const item_size = form_name.split('-')[2];
		const price = parseIfInt(form.value);

		this.setState((state) => {
			let items = new Map([...state.items]);
			switch(price_type){
				case 'production':
					items.get(item_key).production_prices[item_size] = price;
					break;
				case 'selling':
					items.get(item_key).selling_prices[item_size] = price;
					break;
				default: null;			
			}
			return {items: items};
		});
	}

	storeItems(){
		const root = this.props.root;
		const parent = this.props.parent;
		const data = {
			items: JSON.stringify(root.formatItemsForStoring(this.state.items)),
		};
		root.setState(({dark_lds: true}));
		xhttpPost(
			serializeObj(data),
			root.props.urls.store_items_storage,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
				root.setState({items: undefined, dark_lds: false,});
				parent.changeView(0);
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
				root.setState({dark_lds: false});
            }, this
        );
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
					Buat Item
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
			<div style={{width: '100%', height: '1px', margin: '2rem 0 4rem',
			backgroundColor: '#6993FF'}}></div>
			<Buttons tag={'button'}
				settings={{size: 'md',type: 'primary',color: 'blue'}}
				text={'Simpan'}
				classes={'block'}
				attr={{
					style: {margin: '0 auto', width: '14rem'},
					onClick: this.storeItems
				}}
			/>						
        </>);
	}
}	