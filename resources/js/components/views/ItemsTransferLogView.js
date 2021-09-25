import React from 'react';

import {Buttons} from './../Buttons.js';
import Table from './../Table.js';
import {SectionHeader} from './../Layouts.js';
import {PlainCard} from './../Cards.js';
import {Select} from './../Forms.js';
import {Modal} from './../Windows.js';
import {SVGIcons,Label} from './../UtilityComponents.js';
import {xhttpPost,serializeObj,prettyTime,parseIfInt} from './../Utilities.js';

export default class ItemsTransferLogView extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            /* Transfer details states */
            transfer_detail_modal: false,
            item_name: '',
            item_quantities: null,
            /*Filter log states*/
            filter_log_modal: false,
            origin_store_id: 'all',
            target_store_id: 'all',
            rows_limit: 6,
			// If the last row of store items is loaded
			last_row_loaded: (this.props.items_transfer_log ? 
                this.props.root.detectLastRows(
                    this.props.items_transfer_log.rows.length,
                    this.props.items_transfer_log.filters.rows_offset,
                    this.props.items_transfer_log.filters.rows_limit
                ) : false
            ),                
        };

        this.generateItemsTransferLog = this.generateItemsTransferLog.bind(this);
        this.loadLog = this.loadLog.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.filterLog = this.filterLog.bind(this);
        this.viewTransferDetails = this.viewTransferDetails.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
    }

    generateItemsTransferLog(){
		if(this.props.items_transfer_log === undefined)
			return this.props.root.viewStatusMsg('Loading...');

		if(this.props.items_transfer_log.rows.length === 0)
            return this.props.root.viewStatusMsg('Transfer item tidak ditemukan.');
        
        const TableHeadings_JSX = [
            'Item','Total Jumlah','Dari',
            'Menuju','Oleh','Pada','Actions'
        ];
        const TableBody_JSX = this.props.items_transfer_log.rows.map((row) => ([
            row.item_name,
            (() => {
                const quantities = JSON.parse(row.quantities);
                let total_items_transfered = 0;
                for(let size in quantities){
                    total_items_transfered += quantities[size];
                }
                return total_items_transfered;
            })(),
            row.origin_store_name,
            row.target_store_name,
            row.employee_name,
            prettyTime(row.added_at, true),
            <span className="actions-col">
                <Buttons 
                    tag={'button'} text={'Lihat detail'}
                    settings={{size: 'sm',type: 'light',color: 'blue'}}
                    icon={{ name: 'visible', iconOnly: true }}
                    attr={{
                        type: 'button',
                        onClick: () => this.viewTransferDetails(
                            row.item_name,row.quantities,
                        )
                    }}
                />                        
            </span>                
        ]));

        return (
            <PlainCard
                content={<>
                    <Table
                    	headings={TableHeadings_JSX}
                    	body={TableBody_JSX}
                    />
                    {(this.state.last_row_loaded === false ?
                    <button className="load-more-btn block text-blue flex-row 
                    items-center content-center" type="button"
                    onClick={this.loadLog}>
                        <SVGIcons name={'arrow_to_bottom'} color={'blue'}/>
                        Load more
                    </button> : ''
                    )}                    
                </>}
            />         
        );

    }

    loadLog(){
		const root = this.props.root;

		xhttpPost('', root.props.urls.load_items_transfer_log,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
				root.setState((state) => {
					let items_transfer_log = {...state.items_transfer_log};
                    items_transfer_log.rows.push(...JSON.parse(response));
                    items_transfer_log.filters.rows_offset += 
                        items_transfer_log.filters.rows_limit;

					return {
                        items_transfer_log: items_transfer_log,
                        dark_lds: false
                    };
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
        const value = (is_int ? parseIfInt(form.value) : form.value);
		this.setState({[form.name]: value});
	}

    filterLog(){
		const root = this.props.root;
        const data = {
            origin_store_id: this.state.origin_store_id,
            target_store_id: this.state.target_store_id,
            rows_limit: this.state.rows_limit
        };
        root.setState({dark_lds: true});
		xhttpPost(
            serializeObj(data), 
            root.props.urls.index_items_transfer_log,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code){
                root.setState((state) => {
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
                    return {
                        items_transfer_log: items_transfer_log,
                        dark_lds: false,
                    };
                });
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }
        );         
    }

    viewTransferDetails(item_name, item_quantities){
        this.setState({
            item_name: item_name,
            item_quantities: JSON.parse(item_quantities),
            transfer_detail_modal: true,
        });
    }

    refreshPage(force = false){
        if(this.props.items_transfer_log === undefined || force){
            this.props.root.refreshItemsTransferLog(force);
        }
    }

    toggleModal(modal_name){
        this.setState((state) => (
            {[modal_name]: !state[modal_name]}
        ));
    }    

    componentDidMount(){;
        this.props.root.scrollToTop();
        this.refreshPage();
    }

    componentDidUpdate(prevProps){
        if(prevProps.items_transfer_log !== this.props.items_transfer_log){
            const current_log = this.props.items_transfer_log;
            const prev_log = prevProps.items_transfer_log;

            let changed_states = {
                filter_log_modal: false,
                transfer_detail_modal: false,
            };
            // If the store is undefined, refresh the store again
            if(current_log === undefined){
                this.setState(changed_states);
                this.refreshPage(true);
            }
            else{
                changed_states.last_row_loaded = this.props.root.detectLastRows(
                    current_log.rows.length,
                    current_log.filters.rows_offset,
                    current_log.filters.rows_limit
                );
                this.setState(changed_states);
            }
        }        
    }

    render(){
        return (<>
			<SectionHeader
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'share'} color={'blue'}
						attr={{style: {width: '1.6em'}}}
					/>						
					Riwayat Transfer
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
            <div className="flex-row content-end">
                <Buttons
					tag={'button'} text={'Filter'} icon={{name: 'sort_1'}}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    attr={{type: 'button',
						style: {marginBottom: '2rem', width: '10rem'},
                        onClick: () => {this.toggleModal('filter_log_modal')},
                    }}
                />                  
            </div>
            {this.generateItemsTransferLog()}
            <Modal
                toggleModal = {() => {this.toggleModal('filter_log_modal')}}
                modalShown = {this.state.filter_log_modal}
                heading = {'Filter Riwayat Transfer'}
                attr={{id: 'filter-log-modal'}}
                footer_align={'center'} classes={'content-sized-modal'}                
                body={<>
                    <Select
                        type={'outline'} size={'md-input'}
                        form_name={'origin_store_id'} label={'Dari'}
                        options={(() => {
                            let options = [{value: 'all', text: 'Semua'}];
                            if(this.props.items_transfer_log){
                                this.props.items_transfer_log.all_stores.forEach((store) => {
                                    options.push({value: store.id, text: store.name})
                                });
                            }
                            return options;
                        })()}
                        form_attr={{value: this.state.origin_store_id,
                            style: {marginBottom: '2rem',width: '100%'},
                            onChange: (e) => {this.handleChange(e, true)},
                        }}
                        container_attr={{style: {width: '100%'}}}
                    />
                    <Select
                        type={'outline'} size={'md-input'}
                        form_name={'target_store_id'} label={'Menuju'}
                        options={(() => {
                            let options = [{value: 'all', text: 'Semua'}];
                            if(this.props.items_transfer_log){
                                this.props.items_transfer_log.all_stores.forEach((store) => {
                                    options.push({value: store.id, text: store.name})
                                });
                            }
                            return options;
                        })()}
                        form_attr={{value: this.state.target_store_id,
                            style: {marginBottom: '2rem',width: '100%'},
                            onChange: (e) => {this.handleChange(e, true)},
                        }}
                        container_attr={{style: {width: '100%'}}}
                    />
                    <Select
                        type={'outline'} size={'md-input'}
                        form_name={'rows_limit'} label={'Baris ditampilkan'}
                        options={[{value: 6},{value: 12},{value: 20}]}
                        form_attr={{
                            value: this.state.rows_limit, style: {width: '100%'},
                            onChange: (e) => {this.handleChange(e, true)},
                        }}
                        container_attr={{style: {width: '100%'}}}
                    />                                          
                </>}
                footer={
                    <Buttons tag={'button'} text={'Filter'}
                        settings={{size: 'md',type: 'primary',color: 'blue'}}
                        attr={{type: 'button', style: {width: '10rem'},
                            onClick: this.filterLog,
                        }}
                    />            
                }
            />               
            <Modal
                toggleModal = {() => {this.toggleModal('transfer_detail_modal')}}
                modalShown = {this.state.transfer_detail_modal}
                heading = {'Detail Transfer'}
                footer_align={'center'} classes={'content-sized-modal'}                
                body={(() => {
                    if(this.state.item_name === '')
                        return '';
                    const TableHeadings = ['Ukuran','Jumlah'];
                    const TableBody = [];
                    let total_items_transfered = 0
                    for(let size in this.state.item_quantities){
                        total_items_transfered += this.state.item_quantities[size];
                        TableBody.push(
                            [size.toUpperCase(), this.state.item_quantities[size]]
                        );
                    }
                    return (<>
                        <Label
                        	type={'light'} color={'blue'} tag={'p'}
                        	text={this.state.item_name} classes={'block text-center'}
                            attr={{style: {width: '100%'}}}
                        />                    
                        <Table
                            headings={TableHeadings}
                            body={TableBody}
                        />
                        <p className="text-medium text-dark-65"
                        style={{borderTop: '0.1rem solid #D9D9D9',padding: '0.8em 0.8em 0'}}>
                            {'Total: '+total_items_transfered}
                        </p>
                    </>);
                })()}
            />             
        </>);
    }
}