Ext.define('Optima5.Modules.Spec.DbsLam.LiveManAdrPanel',{
	extend:'Ext.form.Panel',
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 75
			},
			items:[{
				height: 56,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>No location available</b><br>Enter manual location or close window to cancel'}
			},{
				xtype: 'fieldcontainer',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				anchor: '100%',
				fieldLabel: 'Adresse',
				items: [{
					xtype: 'textfield',
					name: 'adr_id',
					width: 150
				},{
					itemId: 'btnSetAdr',
					hidden: true,
					xtype:'component',
					cls: 'op5-spec-dbslam-reloadheader',
					html: [
						'<div class="op5-spec-dbslam-reloadheader-wrap" style="position:relative">',
							'<div class="op5-spec-dbslam-reloadheader-btn">',
							'</div>',
						'</div>'
					],
					listeners: {
						afterrender: function(cmp) {
							var headerEl = cmp.getEl(),
								btnCloseEl = headerEl.down('.op5-spec-dbslam-reloadheader-btn') ;
							btnCloseEl.on('click',function() {
								this.handleSetAdr() ;
							},this) ;
						},
						scope: this
					}
				},{
					itemId: 'btnUnsetAdr',
					hidden: true,
					xtype:'component',
					cls: 'op5-spec-dbslam-closeheader',
					html: [
						'<div class="op5-spec-dbslam-closeheader-wrap" style="position:relative">',
							'<div class="op5-spec-dbslam-closeheader-btn">',
							'</div>',
						'</div>'
					],
					listeners: {
						afterrender: function(cmp) {
							var headerEl = cmp.getEl(),
								btnCloseEl = headerEl.down('.op5-spec-dbslam-closeheader-btn') ;
							btnCloseEl.on('click',function() {
								this.handleUnsetAdr() ;
							},this) ;
						},
						scope: this
					}
				}]
			},{
				itemId: 'fEmpty',
				hidden: true,
				xtype: 'displayfield',
				fieldLabel: 'Status',
				value: '<b>Empty</b>'
			},{
				xtype: 'grid',
				height: 150,
				itemId: 'pStockGrid',
				hidden: true,
				columns: [{
					dataIndex: 'inv_prod',
					text: 'Article',
					width: 100
				},{
					dataIndex: 'inv_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'inv_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75
				},{
					dataIndex: 'inv_sn',
					text: 'Serial',
					width: 100
				}],
				store: {
					model: 'DbsLamStockGridModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				}
			}],
			buttons: [{
				xtype: 'button',
				disabled: true,
				itemId: 'btnSubmit',
				text: 'Submit',
				handler:function(btn){ 
					this.handleSubmit() ;
				},
				scope: this
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().reset() ;
		this.down('#btnSetAdr').setVisible(true) ;
	},
	getFormValues: function() {
		var formPanel = this,
			form = formPanel.getForm() ;
		return form.getValues(false,false,false,true) ;
	},
	handleSetAdr: function() {
		var adrId = this.getFormValues()['adr_id'] ;
		if( Ext.isEmpty(adrId.trim()) ) {
			return ;
		}
		
		this.down('#btnSetAdr').setVisible(false) ;
		this.getForm().findField('adr_id').setReadOnly(true) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'stock_getGrid',
				filter_entryKey: adrId.trim().toUpperCase()
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error', function() {
						this.handleUnsetAdr() ;
					},this) ;
					return ;
				}
				if( ajaxResponse.data.length==0 ) {
					this.handleUnsetAdr() ;
					return ;
				}
				
				this.down('#btnSubmit').setDisabled(false) ;
				
				var adrId = ajaxResponse.data[0].ADR_entry_key ;
				this.getForm().findField('adr_id').setValue(adrId) ;
				this.getForm().findField('adr_id').setReadOnly(true) ;
				
				this.down('#btnUnsetAdr').setVisible(true) ;
				if( ajaxResponse.data.length==1 && Ext.isEmpty(ajaxResponse.data[0].stk_filerecord_id) ) {
					this.down('#fEmpty').setVisible(true) ;
					return ;
				}
				this.down('#pStockGrid').getStore().loadData( ajaxResponse.data ) ;
				this.down('#pStockGrid').setVisible(true) ;
			},
			scope: this
		}) ;
	},
	handleUnsetAdr: function() {
		this.down('#btnSubmit').setDisabled(true) ;
		
		this.down('#pStockGrid').getStore().removeAll() ;
		this.down('#pStockGrid').setVisible(false) ;
		this.down('#fEmpty').setVisible(false) ;
		this.down('#btnUnsetAdr').setVisible(false) ;
		this.getForm().reset() ;
		this.getForm().findField('adr_id').setReadOnly(false) ;
		this.down('#btnSetAdr').setVisible(true) ;
	},
	handleSubmit: function() {
		if( !this.getForm().findField('adr_id').readOnly ) {
			Ext.Msg.alert('Error','Invalid state') ;
			return ;
		}
		this.fireEvent('dolocate',this,this.getFormValues()) ;
	}
});
