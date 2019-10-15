Ext.define('Optima5.Modules.Spec.DbsLam.StockInvForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.CfgParamField'
	],
	
	initComponent: function() {
		var optimaModule = this.optimaModule ;
		
		var atrStkFormFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( Ext.isEmpty(attribute.STOCK_fieldcode) && Ext.isEmpty(attribute.ADR_fieldcode) ) {
				return ;
			}
			
			var mkey ;
			if( !Ext.isEmpty(attribute.STOCK_fieldcode) ) {
				mkey = 'STOCK_'+attribute.mkey ;
			}
			else if( !Ext.isEmpty(attribute.ADR_fieldcode) ) {
				mkey = 'ADR_'+attribute.mkey ;
			}
			
			var fieldEditor ;
			if( attribute.bible_code ) {
				fieldEditor = {
					xtype:'op5crmbasebibletreepicker',
					selectMode: 'single',
					optimaModule: optimaModule,
					bibleId: attribute.bible_code
				} ;
			} else  {
				fieldEditor = {
					xtype:'textfield'
				} ;
			}
			Ext.apply(fieldEditor,{
				fieldLabel: attribute.atr_txt,
				name: mkey,
				readOnly: true,
				adjustStkToggle: true
			}) ;
			atrStkFormFields.push(fieldEditor) ;
		},this) ;
		
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			layout: 'anchor',
			fieldDefaults: {
				labelWidth:100,
				anchor:'100%'
			},
			items: [{
				xtype: 'displayfield',
				name: 'adr_id',
				fieldStyle: 'font-weight:bold',
				fieldLabel: 'Location'
			},{
				xtype: 'hiddenfield',
				name: 'stk_filerecord_id'
			},{
				xtype: 'fieldset',
				title: 'Stock attributes',
				hidden: (atrStkFormFields.length==0),
				items: atrStkFormFields
			},{
				xtype: 'fieldset',
				itemId: 'fsContainer',
				title: 'Container',
				items: [Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
					fieldLabel: 'Container type',
					name: 'inv_container_type',
					optimaModule: this.optimaModule,
					cfgParam_id: 'CONTAINER',
					readOnly: true,
					adjustStkToggle: true
				}),{
					xtype: 'textfield',
					name: 'inv_container_ref',
					fieldLabel: 'Container ID',
					readOnly: true,
					adjustStkToggle: true
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsProduct',
				title: 'Product',
				items: [Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
					fieldLabel: 'Entité',
					name: 'inv_soc',
					optimaModule: this.optimaModule,
					cfgParam_id: 'SOC',
					readOnly: true,
					adjustStkToggle: true
				}),{
					xtype: 'op5crmbasebiblepicker',
					bibleId: 'PROD',
					optimaModule: this.optimaModule,
					fieldLabel: 'P/N',
					name: 'inv_prod',
					readOnly: true,
					adjustStkToggle: true
				},{
					xtype: 'textfield',
					name: 'inv_batch',
					fieldLabel: 'BatchCode',
					readOnly: true,
					adjustStkToggle: true
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'inv_datelc',
					fieldLabel: 'DateLC',
					readOnly: true,
					adjustStkToggle: true
				},{
					xtype: 'textfield',
					name: 'inv_sn',
					fieldLabel: 'S/N',
					readOnly: true,
					adjustStkToggle: true
				},{
					xtype: 'textfield',
					name: 'inv_qty',
					fieldLabel: 'Qty',
					readOnly: true
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsWarning',
				title: 'Warning status',
				items: [{
					xtype: 'checkboxfield',
					name: 'warn_is_on',
					boxLabel: 'Warning enabled ?'
				},{
					xtype: 'checkboxfield',
					name: 'warn_is_locked',
					boxLabel: 'Service locked ?'
				},{
					xtype: 'textfield',
					name: 'warn_txt',
					fieldLabel: 'Description'
				},{
					xtype: 'container',
					hidden: true,
					itemId: 'cntWarningSubmit',
					anchor: '100%',
					padding: 6,
					layout: {
						type: 'hbox',
						pack: 'end'
					},
					items: [{
						xtype: 'button',
						scale: 'medium',
						icon: 'images/op5img/ico_procblue_16.gif',
						text: 'Submit',
						handler: function() {
							this.handleSubmitAction('warn_status') ;
						},
						scope: this
					}]
				}]
			},{
				xtype: 'fieldset',
				checkboxName: 'qty_toggle',
				checkboxToggle: true,
				itemId: 'fsEditQty',
				title: 'Adujust Qty',
				items: [{
					xtype: 'textfield',
					name: 'adjust_qty_txt',
					allowBlank: false,
					fieldLabel: 'Comment',
					labelStyle: 'font-weight:bold'
				},{
					xtype: 'numberfield',
					anchor: '',
					width: 200,
					name: 'adjust_qty',
					fieldLabel: 'Qty +/-',
					labelStyle: 'font-weight:bold',
					listeners: {
						change: this.onChangeQty,
						scope: this
					}
				},{
					xtype: 'textfield',
					name: 'target_qty',
					fieldLabel: 'Qty',
					readOnly: true
				},{
					xtype: 'container',
					anchor: '100%',
					padding: 6,
					layout: {
						type: 'hbox',
						pack: 'end'
					},
					items: [{
						xtype: 'button',
						scale: 'medium',
						icon: 'images/op5img/ico_procblue_16.gif',
						text: 'Submit',
						handler: function() {
							this.handleSubmitAction('adjust_qty') ;
						},
						scope: this
					}]
				}]
			},{
				xtype: 'fieldset',
				checkboxName: 'stk_toggle',
				checkboxToggle: true,
				itemId: 'fsEditStk',
				title: 'Adjust Properties',
				items: [{
					xtype: 'textfield',
					name: 'adjust_stk_txt',
					allowBlank: false,
					fieldLabel: 'Comment',
					labelStyle: 'font-weight:bold'
				},{
					xtype: 'container',
					anchor: '100%',
					padding: 6,
					layout: {
						type: 'hbox',
						pack: 'end'
					},
					items: [{
						xtype: 'button',
						scale: 'medium',
						icon: 'images/op5img/ico_procblue_16.gif',
						text: 'Submit',
						handler: function() {
							this.handleSubmitAction('adjust_stk') ;
						},
						scope: this
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each(function(field) {
			field.on('change',function(ifield){
				if( !this.init_done ) {
					return ;
				}
				this.calcLayout(ifield) ;
				if( ifield.getName()=='stk_toggle' && ifield.getValue() ) {
					this.onAdjustStkStart() ;
				}
				if( ifield.adjustStkToggle ) {
					this.onAdjustStkFieldChange(ifield) ;
				}
				if( ifield.getName()=='stk_toggle' && !ifield.getValue() ) {
					this.onAdjustStkEndAbort() ;
				}
				if( ifield.getName().indexOf('warn_')===0 ) {
					this.onWarningFieldChange() ;
				}
				this.fireEvent('change') ;
			},this) ;
		},this) ;
		
		this.getForm().reset();
		
		if( this._cfg_adrId ) {
			this.do_init_params() ;
		}
	},
	calcLayout: function(field) {
		if( !field || field.getName()=='inv_soc' ) {
			var socCode = this.getForm().findField('inv_soc').getValue(),
				socRow = Optima5.Modules.Spec.DbsLam.HelperCache.getSoc(socCode) ;
			if( socRow ) {
				var form = this.getForm() ;
				form.findField('inv_batch').setVisible( socRow.prodspec_is_batch ) ;
				form.findField('inv_datelc').setVisible( socRow.prodspec_is_dlc ) ;
				form.findField('inv_sn').setVisible( socRow.prodspec_is_sn ) ;
			}
		}
		if( !field || field.getName().indexOf('warn_')===0 ) {
			var warnEnabled = this.getForm().findField('warn_is_on').getValue() ;
			this.getForm().findField('warn_is_locked').setVisible(warnEnabled);
			this.getForm().findField('warn_txt').setVisible(warnEnabled);
		}
	},
	onWarningFieldChange: function() {
		this.down('#cntWarningSubmit').setVisible(true) ;
	},
	do_init_params: function() {
		this.init_inv( this._cfg_adrId, (this._cfg_stkFilerecordId>0 ? this._cfg_stkFilerecordId : null) ) ;
	},
	init_inv: function( adrId, stkFilerecordId=null ) {
		this.down('#fsContainer').setVisible( false ) ;
		this.getForm().setValues({
			qty_toggle: false,
			adjust_qty: 0,
			
			stk_toggle: false
		});
		
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'stock_getGrid',
			filter_entryKey: Ext.JSON.encode([adrId])
		} ;
		if( !Ext.isEmpty(stkFilerecordId) ) {
			Ext.apply(ajaxParams,{
				filter_stkFilerecordId: Ext.JSON.encode([stkFilerecordId])
			})
		}
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onInitLoad(ajaxResponse.data[0]) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onInitLoad: function( ajaxData ) {
		var formValues = ajaxData
		this.getForm().setValues(formValues);
		this.down('#fsContainer').setVisible( !Ext.isEmpty(formValues.inv_container_ref) ) ;
		
		this.getForm().setValues({
			qty_toggle: false,
			adjust_qty: 0,
			
			stk_toggle: false
		});
		this.down('#cntWarningSubmit').setVisible(false) ;
		
		this.calcLayout() ;
		this.onChangeQty() ;
		
		this.init_done = true ;
	},
	
	
	onAdjustStkStart: function() {
		Ext.Array.each( this.query('[adjustStkToggle=true]'), function(field) {
			field.adjustStkValueOrig = field.getValue() ;
			field.adjustStkValueNew = null ;
			field.setReadOnly(false) ;
		},this) ;
	},
	onAdjustStkFieldChange: function(field) {
		field.adjustStkValueNew = field.getValue() ;
		if( !this.onAdjustStkFieldChangeTask ) {
			this.onAdjustStkFieldChangeTask = new Ext.util.DelayedTask(function(){
				this.onAdjustStkFieldSummary() ;
			},this);
		}
		this.onAdjustStkFieldChangeTask.delay(500) ;
		//this.onAdjustStkFieldSummary() ;
	},
	onAdjustStkFieldSummary: function() {
		//delete all fields
		Ext.Array.each( this.down('#fsEditStk').query('displayfield'), function(df) {
			df.destroy() ;
		}) ;
		
		var fields = [] ;
		Ext.Array.each( this.query('[adjustStkToggle=true]'), function(field) {
			if( field.adjustStkValueNew != null ) {
				fields.push({
					xtype: 'displayfield',
					fieldLabel: field.fieldLabel,
					value: '<strike>'+field.adjustStkValueOrig+'</strike>' + ' > ' + '<b>'+field.adjustStkValueNew+'</b>',
				});
			}
		},this) ;
		this.down('#fsEditStk').insert(0,fields) ;
	},
	onAdjustStkEndAbort: function() {
		Ext.Array.each( this.query('[adjustStkToggle=true]'), function(field) {
			if( field.adjustStkValueOrig ) {
				field.setValue(field.adjustStkValueOrig) ;
				field.adjustStkValueNew = null ;
			}
			field.setReadOnly(true) ;
		},this) ;
		Ext.Array.each( this.down('#fsEditStk').query('displayfield'), function(df) {
			df.destroy() ;
		}) ;
		if( this.onAdjustStkFieldChangeTask ) {
			this.onAdjustStkFieldChangeTask.cancel() ;
			this.onAdjustStkFieldChangeTask = null ;
		}
	},
	
	onChangeQty: function() {
		var form = this.getForm(),
			invQty = parseFloat(form.findField('inv_qty').getValue()),
			adjustQty = parseFloat(form.findField('adjust_qty').getValue()),
			targetQty = invQty+adjustQty ;
		if( isNaN(targetQty) || targetQty<0 ) {
			form.findField('target_qty').setValue( 'ERR' ) ;
		} else {
			form.findField('target_qty').setValue( targetQty ) ;
		}
	},
	
	handleSubmitAction( actionCode ) {
		var formPanel = this,
			form = formPanel.getForm(),
			formValues = form.getFieldValues() ;
		if( !form.isValid() ) {
			//return ;
		}
		
		var dontReload = false ;
		if( actionCode == 'adjust_stk' ) {
			// rewrite formValues
			var cntDiff = 0 ;
			Ext.Array.each( formPanel.query('[adjustStkToggle=true]'), function(field) {
				if( field.adjustStkToggle ) {
					delete formValues[field.getName()] ;
					if( (field.adjustStkValueNew != null) && (field.getValue()==field.adjustStkValueNew)
						&& (field.adjustStkValueNew != field.adjustStkValueOrig)
					) {
						cntDiff++ ;
						formValues[field.getName()] = {
							old_value: field.adjustStkValueOrig,
							new_value: field.adjustStkValueNew
						};
					}
				}
			}) ;
			if( cntDiff == 0 ) {
				Ext.MessageBox.alert('Empty transaction','No change(s) to commit') ;
				return ;
			}
		}
		if( actionCode == 'warn_status' ) {
			dontReload = true ;
		}
		
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'stock_submitInvAction',
			form_action: actionCode,
			form_data: Ext.JSON.encode(formValues)
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success != true ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error||'Error') ;
					this.hideLoadmask() ;
					return ;
				}
				this.fireEvent('saved') ;
				if( !dontReload ) {
					this.destroy() ;
				} else {
					this.do_init_params() ;
				}
			},
			callback: function() {
				//this.hideLoadmask() ;
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
	},
	
	dummyFn: Ext.emptyFn
});
