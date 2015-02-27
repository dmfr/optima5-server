Ext.define('Optima5.Modules.Spec.WbMrfoxy.AttachmentViewerWindow',{
	extend:'Ext.window.Window',
	
	initComponent: function() {
		if( (this.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Spec:WbMrfoxy:AttachmentViewerWindow','No module reference ?') ;
		}
		
		Ext.apply(this,{
			title:'Attachment Viewer',
			//width:dispwidth,
			//height:dispheight,
			iconCls: 'op5-crmbase-dataformwindow-photo-icon',
			animCollapse:false,
			border: false,
			items: [{
				xtype:'image',
				itemId: 'cmpImage',
				//src: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
				resizable: false
			}],
			tbar: [{
				itemId: 'tbToggle',
				hidden: true,
				iconCls: 'op5-spec-mrfoxy-promorow-action-icon-attachments',
				text: '',
				handler: function() {
					this.toggleFormVisibility() ;
				},
				scope: this
			},'->',{
				iconCls: 'icon-save',
				text: 'Download file',
				handler: function() {
					this.handleDownload() ;
				}
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.initCreateForm() ;
		},this) ;
		this.on('beforeclose',this.onBeforeClose,this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
	},
	initCreateForm: function() {
		this.floatForm = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			width: 400,
			height: 250,
			floating: true,
			hidden: true,
			renderTo: this.getEl(),
			hideMode: 'visibility',
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					this.toggleFormVisibility() ;
				},
				scope: this
			}],
			
			title: 'Metadatas',
			bodyPadding: '10px 10px',
			bodyCls: 'ux-noframe-bg',
			cls: 'ux-noframe-bg',
			border: false,
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 110,
				anchor: '100%',
				submitValue: false
			},
			layout: 'anchor',
			items: [{
				xtype:'hiddenfield',
				name:'filerecord_id'
			},{
				xtype:'hiddenfield',
				name:'tmp_id'
			},{
				xtype: 'colorcombo',
				queryMode: 'local',
				forceSelection: true,
				editable: false,
				displayField: 'country_display',
				valueField: 'country_code',
				iconUrlField: 'country_iconurl',
				store: {
					fields: ['country_code','country_display','country_iconurl','country_currency'],
					data : Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll()
				},
				allowBlank: false,
				readOnly: true,
				fieldLabel: 'Country',
				name : 'country_code',
				itemId : 'country_code'
			},{
				xtype: 'datefield',
				fieldLabel: 'Document Date',
				name: 'doc_date',
				allowBlank: false,
				format: 'Y-m-d',
				startDay: 1,
				anchor: '',
				width: 230
			},{
				xtype: 'combobox',
				fieldLabel: 'Attachment Type',
				name: 'doc_type',
				forceSelection: true,
				allowBlank: false,
				editable: false,
				store: this.attachTypesStore,
				queryMode: 'local',
				displayField: 'attachtype_txt',
				valueField: 'attachtype',
				listeners:{
					change: function(field){ field.up('form').calcLayout(); }
				}
			},{
				itemId: 'fsInvoice',
				xtype:'fieldset',
				defaults: {
					anchor: '100%',
					labelWidth: 75
				},
				title: 'Invoices data',
				items:[{
					xtype: 'checkboxfield',
					name:'reject_mode',
					hidden: true
				},{
					hidden: true,
					xtype: 'checkboxfield',
					name:'invoice_is_reject',
					boxLabel: 'Rejected ?'
				},{
					xtype: 'textfield',
					name:'invoice_txt',
					fieldLabel: 'Description'
				},{
					xtype: 'fieldcontainer',
					layout:{
						type: 'hbox',
						align: 'stretch'
					},
					itemId: 'mechanics_mono_discount',
					fieldLabel: 'Amount',
					items:[{
						xtype: 'numberfield',
						name:'invoice_amount',
						anchor: '',
						width: 80,
						minValue: 0
					},{
						xtype:'displayfield',
						name: 'invoice_currency',
						padding: '0px 10px'
					},{
						xtype:'displayfield',
						value: '(Excl. VAT)',
						padding: '0px 10px'
					}]
				}]
			}],
			buttons: [
				{ xtype: 'button', text: 'Submit' , handler:function(btn){ btn.up('form').handleSubmit();} }
			],
			
			calcLayout: function() {
				var formPanel = this,
					form = formPanel.getForm(),
					formValues = form.getValues(false,false,false,true),
					typeField = form.findField('doc_type'),
					typeValue = typeField.getValue(),
					isInvoice = (Ext.isEmpty(typeValue) ? false : typeField.getStore().getById(typeValue).get('is_invoice')),
					countryField = form.findField('country_code'),
					countryValue = countryField.getValue(),
					countryCurrency = (Ext.isEmpty(countryValue) ? '' : countryField.getStore().getById(countryValue).get('country_currency')) ;
				
				formPanel.down('#fsInvoice').setVisible(isInvoice) ;
				form.findField('invoice_amount').allowBlank = !isInvoice ;
				form.findField('invoice_currency').setValue(countryCurrency) ;
				
				form.findField('invoice_is_reject').setVisible( form.findField('reject_mode').getValue() ) ;
				
				var countryCode = formValues.country_code
			},
			
			handleSubmit: function() {
				var formPanel = this,
					baseForm = this.getForm() ;
				if(baseForm.isValid()){
					var ajaxParams = this.optimaModule.getConfiguredAjaxParams(),
						formValues = baseForm.getValues(false,false,false,true) ;
					Ext.apply( ajaxParams, {
						_moduleId: 'spec_wb_mrfoxy',
						_action: 'attachments_setAttachment',
						data: Ext.JSON.encode(formValues)
					}) ;
					
					var msgbox = Ext.Msg.wait('Please wait...') ;
					baseForm.submit({
						url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						params: ajaxParams,
						success : function(form,action){
							if( !Ext.isEmpty(msgbox) ) {
								msgbox.close() ;
							}
							Ext.menu.Manager.hideAll();
							
							var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
							form.findField('tmp_id').setValue(null) ;
							form.findField('filerecord_id').setValue(ajaxData.filerecord_id) ;
							
							this.fireEvent('submitok') ;
						},
						failure: function(fp, o) {
							if( !Ext.isEmpty(msgbox) ) {
								msgbox.close() ;
							}
							Ext.Msg.alert('Error','Error during transaction') ;
						},
						scope: formPanel
					});
				}
			},
			
			listeners: {
				submitok: function(){
					this.fireEvent('submitok') ;
					this.destroy() ;
				},
				scope: this
			}
		});
	},
	
	loadTmpMedia: function( tmpId, countryCode ) {
		if( !this.rendered ) {
			this.on('afterrender', function() {
				this.loadTmpMedia(tmpId) ;
			},this,{single:true});
		}
		
		// Set window
		var mediaId = tmpId ;
		this.loadMedia(mediaId) ;
		
		// Set form
		this.floatForm.getForm().setValues({
			tmp_id: tmpId,
			country_code: countryCode
		}) ;
	},
	loadFilerecord: function( filerecordId ) {
		if( !this.rendered ) {
			this.on('afterrender', function() {
				this.loadFilerecord(filerecordId) ;
			},this,{single:true});
		}
		
		// Set window
		this.loadMedia(filerecordId) ;
		
		// Load form
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'attachments_getList',
				filter_id: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success && Ext.isArray(ajaxObj.data) && ajaxObj.data.length==1 ) {
					var values = ajaxObj.data[0],
						form = this.floatForm.getForm() ;
					form.setValues( values ) ;
					form.findField('reject_mode').setValue( form.findField('invoice_is_reject').getValue() ) ;
				}
			},
			scope: this
		});
		
	},
	loadMedia: function(mediaId) {
		this.mediaId = mediaId ;
		
		var getParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply( getParams, {
			media_id: mediaId,
			thumb:''
		});
		
		var getParamsDownload = {} ;
		Ext.apply( getParamsDownload, getParams ) ;
		Ext.apply( getParamsDownload, {
			download: true
		});
		
		var getSizeParams = new Object() ;
		Ext.apply( getSizeParams, getParams );
		Ext.apply( getSizeParams, {
			getsize:'true'
		});
		Ext.Ajax.request({
			url: 'server/backend_media.php',
			params: getSizeParams,
			method:'GET',
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					return ;
				}
				var width = parseInt( Ext.decode(response.responseText).width ) ;
				var height = parseInt( Ext.decode(response.responseText).height ) ;
				this.setSize(width,height) ;
				this.down('#cmpImage').setSrc('server/backend_media.php?' + Ext.Object.toQueryString(getParams)) ;
				this.fireEvent('load',this) ;
				Ext.defer(function() {
					this.toggleFormVisibility(true) ;
				},500,this) ;
			},
			scope: this
		});
	},
	toggleFormVisibility: function(trueOrFalse) {
		var formPanel = this.floatForm ;
		formPanel.calcLayout() ;
		if( trueOrFalse || !formPanel.isVisible() ) {
			formPanel.show() ;
			formPanel.getEl().alignTo(this.down('#cmpImage').getEl(),'tl-tl?') ;
		} else {
			formPanel.hide() ;
		}
		this.down('#tbToggle').setVisible(true) ;
		this.down('#tbToggle').setText( formPanel.isVisible() ? 'Hide form' : '<b>Show form</b>' ) ;
	},
	
	onBeforeClose: function() {
		if( !this.floatForm ) {
			return true ;
		}
		
		var formPanel = this.floatForm,
			form = formPanel.getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !Ext.isEmpty(formValues.tmp_id) ) {
			Ext.Msg.confirm('Unsaved attachment','Uploaded attachment will be discarded',function(btn) {
				if( btn == 'yes' ) {
					this.doDiscardAttachment() ;
				}
			},this) ;
			return false ;
		}
		return true ;
	},
	onBeforeDestroy: function() {
		this.doDiscardAttachment() ;
		
		if( this.floatForm ) {
			this.floatForm.destroy() ;
			this.floatForm = null ;
		}
		
		return true ;
	},
	doDiscardAttachment: function() {
		if( !this.floatForm ) {
			return true ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_mrfoxy',
				_action: 'attachments_delete',
				filerecord_id: this.floatForm.getForm().getValues(false,false,false,true).tmp_id
			},
			success: function(response) {
				var ajaxObj = Ext.decode(response.responseText) ;
				if( ajaxObj.success && this.floatForm ) {
					this.floatForm.getForm().reset() ;
					this.destroy() ;
				}
			},
			scope: this
		});
	}
});