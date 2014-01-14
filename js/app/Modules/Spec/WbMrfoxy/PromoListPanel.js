Ext.define('WbMrfoxyPromoListModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'string'},
        {name: 'promo_id',  type: 'string'},
        {name: 'country_code',  type: 'string'},
        {name: 'status_text',  type: 'string'},
        {name: 'status_percent',  type: 'string'},
        {name: 'status_color',  type: 'string'},
        {name: 'prod_text',  type: 'string'},
        {name: 'store_text',   type: 'string'},
        {name: 'date_start',   type: 'string'},
        {name: 'date_end',   type: 'string'},
        {name: 'calc_uplift_vol',   type: 'string'},
        {name: 'calc_uplift_per',   type: 'string'},
        {name: 'calc_roi',   type: 'string'}
     ],
	  idgen: 'sequential'
});

Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListPanel',{
	extend:'Ext.grid.Panel',
	
	requires : [
		'Ext.ux.RowExpander'
	],
	plugins: [{
		ptype:'rowexpander',
		rowBodyTpl : ['<div id="RowBody-{id}" ></div>']
	}],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout:'border',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCountry',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbCountrySelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'country_code', type: 'string'},
								{name: 'country_text', type: 'string'},
								{name: 'country_iconurl', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'country_text',
						rootVisible: true,
						useArrows: true,
					}]
				}
			}],
			border: false,
			store: {
				model: 'WbMrfoxyPromoListModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'promo_getGrid'
					},
					reader: {
						type: 'json',
						root: 'data'
					}
				}),
				listeners: {
					load: function(store) {
						//store.sort('people_name') ;
					}
				}
			},
			progressRenderer: (function () {
				return function(progress,text) {
				};
			})(),
			columns: [{
				text: '',
				width: 24,
				renderer: function( value, metaData, record ) {
					var iconurl = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById(record.get('country_code')).get('country_iconurl') ;
					console.log( iconurl ) ;
					metaData.style = 'background: url(\''+iconurl+'\') no-repeat center center';
					return '' ;
				}
			},{
				text: '<b>Promo#</b>',
				dataIndex: 'promo_id',
				width: 150,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Status',
				width: 100,
				renderer: function(v,m,record) {
					var tmpProgress = record.get('status_percent') / 100 ;
					var tmpText = record.get('status_text') ;
						var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
						b.updateProgress(tmpProgress,tmpText);
						v = Ext.DomHelper.markup(b.getRenderTree());
						b.destroy() ;
					return v;
				}
			},{
				text: 'Date start',
				dataIndex: 'date_start',
				width: 120,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stores',
				dataIndex: 'store_text',
				width: 100
			},{
				text: 'Products',
				dataIndex: 'prod_text',
				width: 100
			}],
			listeners: {
				itemclick: function(view,record) {
					
				},
				scope: this
			},
			viewConfig: {
				listeners: {
					expandbody: function(rowNode, record, expandbody) {
						var targetId = 'RowBody-' + record.get('id');
							
							console.dir(Ext.get(targetId)) ;
						
                        if (Ext.getCmp(targetId + "-panel") == null) {
                            var notesGrid = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel', {
                                forceFit: true,
                                renderTo: targetId,
                                id: targetId + "-panel",
										  height: 150,
										  rowRecord: record
                            });
									 /*
                            rowNode.grid = notesGrid;
                            notesGrid.getEl().swallowEvent(['mouseover', 'mousedown', 'click', 'dblclick', 'onRowFocus']);
                            notesGrid.fireEvent("bind", notesGrid, { id: record.get('id') });
									*/
                        }
					},
					scope: me
				}
			}
		});
		
		this.callParent() ;
		this.loadComponents() ;
	},
	loadComponents: function() {
		var me = this,
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		countryChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll(), function(rec) {
			countryChildren.push({
				leaf:true,
				checked: false,
				country_code: rec.get('country_code'),
				country_text: rec.get('country_display'),
				country_iconurl: rec.get('country_iconurl'),
				icon: rec.get('country_iconurl')
			});
		}, me) ;
		tbCountrySelect.setRootNode({
			root: true,
			children: countryChildren,
			expanded: true,
			country_code:'',
			country_text:'<b>'+'All countries'+'</b>',
			country_iconurl:'images/op5img/ico_planet_small.gif',
			checked:true,
			icon: 'images/op5img/ico_planet_small.gif'
		});
		
		tbCountrySelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectCountry() ;
			}
		},this) ;
		this.onSelectCountry() ;
	},
	
	onSelectCountry: function() {
		var me = this,
			tbCountry = this.query('#tbCountry')[0],
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		tbCountrySelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				tbCountry.setIcon( chrec.get('country_iconurl') ) ;
				tbCountry.setText( chrec.get('country_text') ) ;
				
				//TODO: apply filter
				
				return false ;
			}
		},this);
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});