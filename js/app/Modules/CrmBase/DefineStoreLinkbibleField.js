Ext.define('Optima5.Modules.CrmBase.DefineStoreLinkbibleField', {
	extend:'Ext.form.FieldContainer',
	mixins: {
		field: 'Ext.form.field.Field'
	},
	alias: 'widget.op5crmbasedelinkbiblefield',
	layout: 'hbox',
	combineErrors: true,
	msgTarget :'side',
	invalidMsg : 'Link-to-bible incomplete',
	allowBlank: true,

	linkBiblesStore: null,
	linkTypesStore: null,
	
	isFormField: true,
	submitValue: true,

	initComponent: function() {
		var me = this;
		me.buildField();
		me.callParent();
		this.linkTypeCombo = this.query()[0];
		this.linkBibleCombo = this.query()[1];
		
		me.mon( this.linkTypeCombo, 'change', me.onSubfieldChange, me ) ;
		me.mon( this.linkBibleCombo, 'change', me.onSubfieldChange, me ) ;
		
		me.initField();
	},
	
	//@private
	buildField: function(){
		this.items = [{
			xtype: 'colorcombo',
			width: 48 ,
			isFormField: false,
			forceSelection:true,
			editable:false,
			queryMode: 'local',
			displayField: 'linktypeLib',
			valueField: 'linktypeCode',
			iconClsField: 'linktypeIconCls',
			iconOnly: true,
			store:this.linkTypesStore,
			matchFieldWidth:false,
			listConfig: {width:100}
		},{
			xtype: 'combobox',
			flex: 1,
			isFormField: false,
			forceSelection:true,
			editable:false,
			queryMode: 'local',
			displayField: 'bibleLib',
			valueField: 'bibleCode',
			store:this.linkBiblesStore,
			matchFieldWidth:false,
			listConfig: {width:200}
		}]
	},
	
	getValue: function() {
		var linkValuesObj = this.getLinkValues() ;
		return linkValuesObj.linkType + '%' + linkValuesObj.linkBibleCode ;
	},
	setValue: Ext.emptyFn,
	
	onSubfieldChange: function() {
		this.checkChange() ;
	},
	
	getErrors: function() {
		var me = this ,
		allowBlank = false ;
		
		if( !allowBlank ) {
			if( this.linkTypeCombo.getValue() == null || this.linkTypeCombo.getValue() == '' ) {
						return [me.invalidMsg] ;
			}
			if( this.linkBibleCombo.getValue() == null || this.linkBibleCombo.getValue() == '' ) {
						return [me.invalidMsg] ;
			}
		}
		return [] ;
	},
	isValid : function() {
		var me = this,
			disabled = me.disabled,
			validate = me.forceValidation || !disabled;
			
		
		return validate ? me.validateValue() : disabled;
	},
	validateValue: function() {
		var me = this,
			errors = me.getErrors(),
			isValid = Ext.isEmpty(errors);
		if (!me.preventMark) {
			if (isValid) {
					me.clearInvalid();
			} else {
					me.markInvalid(errors);
			}
		}

		return isValid;
	},
	markInvalid: function(errors) {
		if( this.linkTypeCombo ) {
			this.linkTypeCombo.markInvalid(errors) ;
		}
		if( this.linkBibleCombo ) {
			this.linkBibleCombo.markInvalid(errors) ;
		}
	},
	clearInvalid: function() {
		if( this.linkTypeCombo ) {
			this.linkTypeCombo.clearInvalid() ;
		}
		if( this.linkBibleCombo ) {
			this.linkBibleCombo.clearInvalid() ;
		}
	},
	 
	getLinkValues: function() {
		return {
			linkType: this.linkTypeCombo.getValue(),
			linkBibleCode: this.linkBibleCombo.getValue()
		} ;
	},
	setLinkValues: function( linkValuesObj ) {
		this.linkTypeCombo.setValue( linkValuesObj.linkType ) ;
		this.linkBibleCombo.setValue( linkValuesObj.linkBibleCode ) ;
	}  
});