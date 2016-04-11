Ext.define('Optima5.Modules.Spec.DbsTracy.LivePanel',{
	extend:'Ext.window.Window',
	
	initCloseFieldsetCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-dbslam-closeheader',
			html: [
				'<div class="op5-spec-dbslam-closeheader-wrap" style="position:relative">',
					'<div class="op5-spec-dbslam-closeheader-btn">',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				border: false,
				flex:1,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				items:[{
					height: 72,
					xtype: 'component',
					tpl: [
						'<div class="op5-spec-dbslam-livelogo">',
							'<span>{title}</span>',
							'<div class="op5-spec-dbslam-livelogo-left"></div>',
							'<div class="op5-spec-dbslam-livelogo-right"></div>',
						'</div>'
					],
					data: {title: '&#160;'}
				},{
					xtype:'fieldset',
					itemId: 'fsStepInput',
					hidden: true,
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					defaults: {
						listeners: {
							change: function() {
								this.onInputParams() ;
							},
							scope: this
						}
					},
					items:[Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
						cfgParam_id: 'SOC',
						cfgParam_emptyDisplayText: 'Company',
						icon: 'images/op5img/ico_blocs_small.gif',
						fieldLabel: 'Company',
						optimaModule: this.optimaModule,
						name: 'input_socCode'
					}),Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
						cfgParam_id: 'ORDERFLOWSTEP',
						cfgParam_emptyDisplayText: 'Flow / Step',
						icon: 'images/op5img/ico_blocs_small.gif',
						fieldLabel: 'Transport step',
						optimaModule: this.optimaModule,
						name: 'input_stepCode'
					})]
				},{
					xtype:'fieldset',
					hidden: true,
					itemId: 'fsDocInput',
					title: 'Document selection',
					fieldDefaults: {
						labelWidth: 120,
						anchor: '100%'
					},
					layout: {
						type:'hbox',
						align: 'stretch'
					},
					items:[{
						flex:1,
						xtype: 'fieldcontainer',
						width: 400,
						layout: 'anchor',
						cls: 'op5-spec-dbslam-fieldset',
						items:[Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
							cfgParam_id: 'SOC',
							cfgParam_emptyDisplayText: 'Company',
							icon: 'images/op5img/ico_blocs_small.gif',
							fieldLabel: 'Transfer type / Step',
							optimaModule: this.optimaModule,
							name: 'display_socCode',
							readOnly: true
						}),Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamField',{
							cfgParam_id: 'ORDERFLOWSTEP',
							cfgParam_emptyDisplayText: 'Flow / Step',
							icon: 'images/op5img/ico_blocs_small.gif',
							fieldLabel: 'Transfer step',
							optimaModule: this.optimaModule,
							name: 'display_stepCode',
							readOnly: true
						}),{
							xtype: 'textfield',
							allowBlank:true,
							fieldLabel: 'Item Barcode',
							name: 'input_trsptFileId',
							enableKeyEvents: true,
							listeners: {
								specialkey: function(field,e) {
									if( e.getKey() == e.ENTER || e.getKey() == e.TAB ) {
										this.onInputFile() ;
										e.stopEvent() ;
									}
								},
								scope: this
							}
						}]
					},Ext.apply(this.initCloseFieldsetCfg(),{
						listeners: {
							afterrender: function(cmp) {
								var headerEl = cmp.getEl(),
									btnCloseEl = headerEl.down('.op5-spec-dbslam-closeheader-btn') ;
								btnCloseEl.on('click',function() {
									this.resetForm() ;
								},this) ;
							},
							scope: this
						}
					})]
				},{
					anchor: '100%',
					hidden: true,
					xtype: 'container',
					itemId: 'cntAfter',
					layout: 'hbox',
					defaults: {
						iconAlign: 'top',
						width: 90,
						padding: 10
					},
					items:[{
						xtype:'button',
						itemId: 'btnOk',
						text: '<b>OK !</b>',
						icon: 'images/op5img/ico_ok_16.gif',
						listeners: {
							click: function() {
								this.onInputParams() ;
							},
							scope: this
						}
					},{
						xtype:'box',
						width: 16
					},{
						xtype:'button',
						itemId: 'btnError',
						text: 'Error',
						icon: 'images/op5img/ico_cancel_small.gif',
						listeners: {
							click: function() {
								this.onInputParams() ;
							},
							scope: this
						}
					}]
				}]
			}]
		});
		
		this.callParent() ;
		this.resetForm() ;
	},
	resetForm: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
			  
		formPanel.down('#fsStepInput').setVisible(true);
		formPanel.down('#fsDocInput').setVisible(false);
		formPanel.down('#cntAfter').setVisible(false);
	},
	onInputParams: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
		
		if( form.findField('input_socCode').getValue() && form.findField('input_stepCode').getValue() ) {
			form.setValues({
				display_socCode: form.findField('input_socCode').getValue(),
				display_stepCode: form.findField('input_stepCode').getValue(),
				input_trsptFileId: ''
			}) ;
			formPanel.down('#fsStepInput').setVisible(false);
			formPanel.down('#fsDocInput').setVisible(true);
			formPanel.down('#cntAfter').setVisible(false);
			form.findField('input_trsptFileId').setReadOnly(false) ;
			form.findField('input_trsptFileId').focus(false,100) ;
		}
	},
	onInputFile: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
		form.findField('input_trsptFileId').setReadOnly(true) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'live_stepValidate',
				soc_code: form.findField('input_socCode').getValue(),
				trspt_file_id: form.findField('input_trsptFileId').getValue(),
				step_code: form.findField('input_stepCode').getValue()
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					this.onStepError( ajaxResponse.error );
				} else {
					this.onStepSuccess() ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onStepSuccess: function() {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
		formPanel.down('#cntAfter').setVisible(true);
		formPanel.down('#btnOk').setVisible(true);
		formPanel.down('#btnError').setVisible(false);
	},
	onStepError: function(error) {
		var formPanel = this.down('form'),
			 form = this.down('form').getForm() ;
		formPanel.down('#cntAfter').setVisible(true);
		formPanel.down('#btnOk').setVisible(false);
		formPanel.down('#btnError').setVisible(true);
		Ext.Msg.alert('Error',error,function() {
			this.onInputParams() ;
		},this);
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
