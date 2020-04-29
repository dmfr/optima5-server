Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusTchatPanel',{
	extend:'Ext.form.Panel',

	mixins: ['Ext.form.field.Field'],

	_fileRecord: null,
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Tchat (portail externe)</b>'
				}]
			},{
				xtype: 'container',
				height: 350,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					flex: 1,
					xtype: 'grid',
					cls: 'op5-spec-rsiveo-action-tchat',
					store: {
						fields: [
							{name: 'tchat_date', type:'date', dateFormat:'Y-m-d H:i:s'},
							{name: 'tchat_action', type:'string'},
							{name: 'tchat_txt', type:'string'}
						],
						//data: [],
						data: [],
						sorters: [{
							property: 'tchat_date',
							direction: 'DESC'
						}],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					},
					columns: [{
						dataIndex: 'tchat_action',
						width: 32,
						renderer: function(v,m,r) {
							m.tdCls += ' op5-spec-rsiveo-action-tchat' ;
							return '' ;
						}
					},{
						xtype: 'datecolumn',
						flex: 1,
						format: 'd/m/Y H:i',
						text: 'Date',
						dataIndex: 'tchat_date'
					}],
					features: [{
						ftype: 'rowbody',
						getAdditionalData: function (data, idx, record, orig) {
							// Usually you would style the my-body-class in a CSS file
							return {
								rowBody: '<pre>' + record.get("tchat_txt") + '</pre>',
								rowBodyCls: "op5-spec-rsiveo-action-tchat-rowbody"
							};
						}
					}]
				},{
					xtype: 'box',
					width: 16
				},{
					xtype: 'fieldset',
					flex: 1,
					title: 'Nouveau message / Réponse',
					layout: 'fit',
					items: [{
						xtype: 'textareafield',
						name: 'tchat_txt',
						grow: true
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		console.dir( this._fileRecord ) ;
		var tchatRows = [] ;
		this._fileRecord.actions().each( function(fileActionRecord) {
			var actionRow = fileActionRecord.getData() ;
			if( Ext.Array.contains(['TCHAT_OUT','TCHAT_IN'],actionRow.link_action) ) {
				tchatRows.push({
					tchat_date: actionRow.date_actual,
					tchat_action: actionRow.link_action,
					tchat_txt: actionRow.txt
				})
			}
		}) ;
		this.down('grid').getStore().loadData(tchatRows) ;
	}
})
