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
					value: '<b>Portail sortant</b>'
				}, {
					flex: 1,
					xtype: "radiogroup",
					fieldLabel: "Type de message",
					labelWidth: 100,
					itemId: "radioTchatMode",
					items: [{
						boxLabel: "Message textuel", name: "tchatMode", inputValue: "0", checked: true
					}, {
						boxLabel: "Pièce jointe", name: "tchatMode", inputValue: "1"
					}],
					listeners: {
						change: function (me, newVal, oldVal) {
							if (newVal.tchatMode === "0"){
								this.down('#newMessage').setVisible(true) ;
								this.down('#newPj').setVisible(false) ;
							} else{
								this.down('#newMessage').setVisible(false) ;
								this.down('#newPj').setVisible(true) ;
							}
						},
						scope: this,
					}
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
					viewConfig : {
						trackOver : false,
						enableTextSelection: true
					},
					store: {
						fields: [
							{name: 'tchat_date', type:'date', dateFormat:'Y-m-d H:i:s'},
							{name: 'tchat_desc', type:'string'},
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

							if (v === "TCHAT_OUT"){
								m.tdCls += ' op5-spec-rsiveo-action-tchat-out ux-noframe-bg' ;
								m.align = "right" ;
							} else{
								m.tdCls += ' op5-spec-rsiveo-action-tchat-in' ;
							}
							return '' ;
						}
					},{
						flex: 1,
						text: 'Date',
						dataIndex: 'tchat_date',
						renderer: function (v,m,r) {
							if (r.get("tchat_action") === "TCHAT_OUT"){
								m.align = "right" ;
								m.tdCls += ' ux-noframe-bg' ;
							}
							return r.get('tchat_desc') ;
						}
					}],
					features: [{
						ftype: 'rowbody',
						getAdditionalData: function (data, idx, record, orig) {
							// Usually you would style the my-body-class in a CSS file
							if (record.get("tchat_action") === "TCHAT_OUT"){
								return {
									rowBody: '<pre>' + record.get("tchat_txt") + '</pre>',
									rowBodyCls: "op5-spec-rsiveo-action-tchat-rowbody-out ux-noframe-bg"
								};
							} else{
								return {
									rowBody: '<pre>' + record.get("tchat_txt") + '</pre>',
									rowBodyCls: "op5-spec-rsiveo-action-tchat-rowbody-in"
								};
							}
						}
					}]
				},{
					xtype: 'box',
					width: 16
				},{
					xtype: 'container',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					height: "100%",
					width: "50%",
					items: [{
							xtype: 'fieldset',
							flex: 1,
							itemId: "newMessage",
							title: 'Nouveau message / Réponse',
							layout: 'fit',
							hidden: false,
							items: [{
								xtype: 'textareafield',
								name: 'tchat_txt',
								grow: true
							}]
						},{
							xtype: 'fieldset',
							width: 300,
							title: 'Pièce jointe',
							layout: 'fit',
							itemId: "newPj",
							hidden: true,
							items: [{
								xtype: 'filefield',
								width: 450,
								emptyText: 'Select a file',
								padding: "0 0 5 0",
								fieldLabel: 'Source',
								name: 'bin_file',
								buttonText: '',
								allowBlank: false,
								buttonConfig: {
									iconCls: 'upload-icon'
								}
							},{
								xtype: 'textfield',
								name: 'bin_desc',
								fieldLabel: 'Description'
							}]
						}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		var tchatRows = [] ;
		this._fileRecord.actions().each( function(fileActionRecord) {
			var actionRow = fileActionRecord.getData() ;
			if( Ext.Array.contains(['TCHAT_OUT','TCHAT_IN'],actionRow.link_action) ) {
				var date = Ext.Date.format(actionRow.date_actual, 'd-m-Y à H\\hi') ;
				var str = "<b>" + date + " - " + actionRow.link_txt + "</b>" ;
				tchatRows.push({
					tchat_date: actionRow.date_actual,
					tchat_desc: str,
					tchat_action: actionRow.link_action,
					tchat_txt: actionRow.txt
				})
			}
		}) ;
		this.down('grid').getStore().loadData(tchatRows) ;
	}
})
