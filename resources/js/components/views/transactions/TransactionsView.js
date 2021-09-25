import React from 'react';

import IndexTransactionsView from './IndexTransactionsView.js';
import AddTransactionsView from './AddTransactionsView.js';

import {SVGIcons} from './../../UtilityComponents';
import {numToPrice} from './../../Utilities';
import Table from './../../Table';


export default class TransactionsView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
            current_view: 0,
            sibling_data: null,
        };

        this.generateView = this.generateView.bind(this);
        this.changeView = this.changeView.bind(this);
    }

    changeView(id, sibling_data = null){
        this.setState({current_view: id, sibling_data: sibling_data});
    }
    
    formatItemsForStoring(items){
        let frmtd_items = {};
        items.forEach((item) => {
            frmtd_items[item.id] = {};
            for(let size in item.details){
                frmtd_items[item.id][size] = {
                    quantity: (
                        item.details[size].quantity !== '' ? 
                        item.details[size].quantity :
                        0
                    )
                };
                if(item.details[size].selling_price !== undefined)
                    frmtd_items[item.id][size].selling_price = (
                        item.details[size].selling_price !== '' ? 
                        item.details[size].selling_price :
                        0
                    )                    
            }
        });
        return frmtd_items;
    }   

    generateSoldItems(items){
        let total_items_sold = 0;
        let total = 0;
        let JSX_key = 0;
        let SoldItems_JSX = [];
        let Total_JSX = null;

        items.forEach((item) => {
            for(let size in item.details){
                if(item.details[size].quantity){
                    total_items_sold += item.details[size].quantity;
                    total += (item.details[size].custom_price ?
                        item.details[size].custom_price * item.details[size].quantity :
                        item.details[size].selling_price * item.details[size].quantity
                    );
                    const ItemPrice = (item.details[size].custom_price ? 
                        <span className="flex-row items-center text-blue">
                            <SVGIcons
                                name={'sale_1'} color={'blue'}
                                attr={{style: {width: '1.2em',marginRight: '0.2em'}}}
                            />
                            {'Rp. '+numToPrice(item.details[size].custom_price)}
                        </span> :
                        <span>
                            {'Rp. '+numToPrice(item.details[size].selling_price)}
                        </span>								
                    );
                    SoldItems_JSX.push(
                        <section className="item-details" key={JSX_key}>
                            <h6 className="text-medium text-dark-65">
                                {item.name+' ('+size.toUpperCase()+')'}
                            </h6>
                            <p className="flex-row content-space-between items-center">
                                <span className="flex-row content-start">
                                    <span className="sr-only">Jumlah:</span>
                                    <span>{item.details[size].quantity}</span>
                                    <span style={{margin: '0 0.4em'}}>&times;</span>
                                    <span className="sr-only">Harga jual:</span>
                                    {ItemPrice}
                                </span>
                                <span className="flex-row content-end">
                                    <span className="sr-only">Total:</span>
                                    <span>
                                        {'Rp. '+numToPrice(
                                            item.details[size].quantity *
                                            (
                                                item.details[size].custom_price ?
                                                item.details[size].custom_price :
                                                item.details[size].selling_price
                                            )
                                        )}
                                    </span>
                                </span>
                            </p>
                        </section>                
                    );
                    ++JSX_key;
                }
            }
        });
        if(SoldItems_JSX.length !== 0){
            Total_JSX = (
				<p className="flex-col payment-details">
					<span className="flex-row content-space-between">
						<span>Total:</span>
						<span className="text-medium text-dark-65">
							{'Rp. '+numToPrice(total)}
						</span>
					</span>
					<span className="flex-row content-space-between">
						<span>Total Item:</span>
						<span>
							{total_items_sold}
						</span>
					</span>											
				</p>   
            );
        }
        // console.log(total);
        return (
            <div id="sold-items-details">
                {SoldItems_JSX}
                {Total_JSX}             
            </div>
        );
    } 

    generateView(){
        switch(this.state.current_view){
            case 0: return (
                <IndexTransactionsView
                    root={this.props.root}
                    parent={this}
                    sibling_data={this.state.sibling_data}
                    transactions={this.props.transactions}
                />
            ); break;           
            case 1: return (
                <AddTransactionsView
                    root={this.props.root}
                    parent={this}
                    sibling_data={this.state.sibling_data}
                    transactions={this.props.transactions}
                />
            ); break;
            default: return 'View not found';
        }
    }

    render(){
        return this.generateView();

    }
}	