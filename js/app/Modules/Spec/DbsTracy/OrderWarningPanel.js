Ext.define('Optima5.Modules.Spec.DbsTracy.OrderWarningPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			items:[ me.initHeaderCfg(), {
				itemId: 'pForm',
				border: false,
				xtype:'form',
				height: 150,
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'Warning enabled ?',
					checkboxToggle: true,
					checkboxName: 'warning_is_on',
					items: [Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
						cfgParam_id: 'WARNINGCODE',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						fieldLabel: '<b>Reason codes</b>',
						name: 'warning_code',
						allowBlank: false
					}),{
						xtype: 'textarea',
						fieldLabel: 'Explanation',
						name: 'warning_txt'
					}]
				}]
			}],
			buttons:[{
				itemId: 'btnSubmit',
				text: 'Validation',
				handler: function() {
					this.onSubmit() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		
		if( this._arr_orderFilerecordIds ) {
			this.loadOrders(this._arr_orderFilerecordIds) ;
		}
	},
	loadOrders: function( arr_orderFilerecordIds ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_getRecords',
				filter_orderFilerecordId_arr: Ext.JSON.encode(arr_orderFilerecordIds)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length < 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadOrders(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadOrders: function(ordersData) {
		this._loaded_orderFilerecordIds = null ;
		
		var tmpOrderRecord = Ext.ux.dams.ModelManager.create('DbsTracyFileOrderModel',Ext.clone(ordersData[0])) ;
		
		var arrIdDns = [],
			arr_orderFilerecordIds = [],
			map_hasWarning_objWarning = {} ;
		
		Ext.Array.each( ordersData, function(orderData) {
			arrIdDns.push( orderData.id_dn ) ;
			arr_orderFilerecordIds.push( orderData.order_filerecord_id ) ;
			
			var objWarning = {
				warning_is_on: orderData.warning_is_on,
				warning_code: orderData.warning_code,
				warning_txt: orderData.warning_txt
			};
			var hashWarning = Ext.JSON.encode(objWarning) ;
			map_hasWarning_objWarning[hashWarning] = objWarning ;
		}) ;
		
		this._loaded_orderFilerecordIds = arr_orderFilerecordIds ;
		
		var headerData = {
			id_dn: arrIdDns.join(' <b>+</b> '),
			atr_consignee: tmpOrderRecord.get('atr_consignee'),
			date_rls: Ext.util.Format.date(tmpOrderRecord.steps().findRecord('step_code','10_RLS').get('date_actual'),'d/m/Y H:i:s'),
			kpi_calc_step: tmpOrderRecord.get('kpi_calc_step'),
			kpi_calc_date_target: Ext.util.Format.date(tmpOrderRecord.get('kpi_calc_date_target'),'d/m/Y H:i:s'),
			kpi_calc_date_actual: Ext.util.Format.date(tmpOrderRecord.get('kpi_calc_date_actual'),'d/m/Y H:i:s')
		};
		this.down('#pHeader').update(headerData) ;
		
		if( Object.keys(map_hasWarning_objWarning).length == 1 ) {
			var singleObjKey = Object.keys(map_hasWarning_objWarning)[0] ;
			this.down('#pForm').getForm().setValues( map_hasWarning_objWarning[singleObjKey] ) ;
		} else {
			this.down('#pForm').getForm().setValues( {warning_is_on:false} ) ;
		}
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbstracy-warning-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">DN / BL :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{id_dn}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Consignee :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{atr_consignee}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Date RLS :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{date_rls}</td>',
							'</tr>',
							'</table>',
						'</div>',
					'</div>',
				'</div>',
				{
					disableFormats: true
				}
			]
		} ;
		
		return headerCfg ;
	},
	
	onSubmit: function() {
		var formPanel = this.down('#pForm'),
			form = formPanel.getForm(),
			formData = form.getValues(false,false,false,true) ;
			  
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'order_setWarning',
				order_filerecord_ids: Ext.JSON.encode( this._loaded_orderFilerecordIds ),
				data: Ext.JSON.encode(formData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange',{}) ;
				this.destroy() ;
			},
			callback: function() {
				this.loadMask.destroy() ;
			},
			scope: this
		}) ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}) ;
