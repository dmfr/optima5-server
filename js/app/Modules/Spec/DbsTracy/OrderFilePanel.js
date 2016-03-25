Ext.define('Optima5.Modules.Spec.DbsTracy.OrderFilePanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamText'
	],
	
	initComponent: function() {
		
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
				},
				scope:this
			},{
				iconCls:'op5-sdomains-menu-updateschema',
				text:'<b>Validate</b>',
				handler: function() {
				},
				scope:this
			}],
			items:[{
				flex: 2,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items: [{
					xtype: 'textfield',
					fieldLabel: '<b>WID</b>',
					value: 'MBD/20000001'
				},{
					xtype: 'datefield',
					fieldLabel: 'Created',
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_CONSIGNEE',
					fieldLabel: '<b>Consignee</b>'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_INCOTERM',
					fieldLabel: 'Incoterm'
				},{
					xtype: 'op5specdbstracycfgparamtext',
					cfgParam_id: 'LIST_SERVICE',
					fieldLabel: 'Priority'
				},{
					xtype: 'fieldset',
					title: 'Transport details',
					items: [{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_AIRPORT',
						fieldLabel: 'Origin'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_AIRPORT',
						fieldLabel: 'Destination'
					},{
						xtype: 'op5specdbstracycfgparamtext',
						cfgParam_id: 'LIST_CARRIER',
						fieldLabel: '<b>Carrier</b>'
					}]
				},{
					xtype: 'fieldset',
					title: 'Flight details',
					items: [{
						xtype: 'textfield',
						fieldLabel: 'AWB'
					},{
						xtype: 'datefield',
						fieldLabel: 'Flight date',
						format: 'd/m/Y',
						submitFormat: 'Y-m-d',
					},{
						xtype: 'textfield',
						fieldLabel: 'Flight code'
					}]
				}]
			},{
				flex: 3,
				xtype: 'grid',
				columns: [{
					text: 'DN #',
					width: 75,
					dataIndex: 'tmp_dn'
				},{
					text: 'PO #',
					width: 75,
					dataIndex: 'tmp_po'
				},{
					text: 'Status',
					width: 100,
					renderer: function(v,m,record) {
						var tmpProgress = record.get('tmp_status_percent') / 100 ;
						var tmpText = record.get('tmp_status_text') ;
							var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
							b.updateProgress(tmpProgress,tmpText);
							v = Ext.DomHelper.markup(b.getRenderTree());
							b.destroy() ;
						return v;
					},
				},{
					text: 'Parcels',
					width: 60,
					dataIndex: 'tmp_parcels'
				},{
					text: 'Dimensions',
					width: 150,
					dataIndex: 'tmp_dims'
				}],
				store: {
					fields: ['tmp_dn','tmp_po','tmp_status_percent','tmp_status_text','tmp_parcels','tmp_dims'],
					data: [{
						tmp_dn: '132465',
						tmp_po: '879878',
						tmp_status_percent: 20,
						tmp_status_text: 'WaitDocuments',
						tmp_parcels: '1',
						tmp_dims: '250 x 350 x 1200'
					},{
						tmp_dn: '540000',
						tmp_po: '879899',
						tmp_status_percent: 35,
						tmp_status_text: 'Ready',
						tmp_parcels: '2',
						tmp_dims: '400 x 500 x 500'
					}]
				}
			},{
				flex: 3,
				xtype: 'panel',
				layout: 'border',
				items:[{
					region: 'north',
					title: 'New action',
					collapsible: true,
					collapsed: true,
					xtype: 'form',
					border: false,
					bodyCls: 'ux-noframe-bg',
					bodyPadding: 8,
					layout: 'anchor',
					fieldDefaults: {
						labelWidth: 75,
						anchor: '100%'
					},
					items: [{
						xtype: 'datefield',
						fieldLabel: 'Date Action',
						format: 'Y-m-d',
						width: 175,
						anchor: ''
					},{
						xtype: 'textarea',
						fieldLabel: 'Comment',
					}],
					buttons: [{
						xtype: 'button',
						text: 'OK',
						handler: function( btn ) {
						},
						scope: this
					}]
				},{
					region: 'center',
					flex: 3,
					xtype: 'grid',
					cls: 'op5-spec-dbstracy-feedgrid',
					store: Ext.create('Ext.data.Store', {
						autoLoad: true,
						model: 'FeedItem',
						sortInfo: {
							property: 'pubDate',
							direction: 'DESC'
						},
						proxy: {
							type: 'ajax',
							url: '/feed-proxy.php',
							reader: {
									type: 'xml',
									record: 'item'
							},
							listeners: {
									scope: this
							}
						},
						listeners: {
							scope: this
						}
					}),

					viewConfig: {
						itemId: 'view',
						plugins: [{
							pluginId: 'preview',
							ptype: 'preview',
							bodyField: 'description',
							expanded: true
						}],
						listeners: {
							scope: this,
						}
					},
					columns: [{
						text: 'Title',
						dataIndex: 'title',
						flex: 1,
						hidden: true
					}, {
						text: 'Author',
						dataIndex: 'author',
						hidden: false,
						width: 200
					}, {
						text: 'Date',
						dataIndex: 'pubDate',
						renderer: function(date){
							if (!date) {
									return '';
							}

							var now = new Date(), d = Ext.Date.clearTime(now, true), notime = Ext.Date.clearTime(date, true).getTime();

							if (notime === d.getTime()) {
									return 'Today ' + Ext.Date.format(date, 'g:i a');
							}

							d = Ext.Date.add(d, 'd', -6);
							if (d.getTime() <= notime) {
									return Ext.Date.format(date, 'D g:i a');
							}
							return Ext.Date.format(date, 'Y/m/d g:i a');
						},
						width: 200
					}]
				}]
			}]
		}) ;
		this.callParent() ;
	}
});
